// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  expressionBuilder,
  type OperandExpression,
  sql,
  type SqlBool,
} from 'kysely';

import { text } from '../../shared/text';
import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import { getFilterExpression } from './filters';
import { toCanonicalLicenseName } from './utils';

export async function manualAttributionStatistics() {
  const db = getDb();

  async function attributionStats(e: OperandExpression<SqlBool>) {
    return (
      await db
        .selectFrom('attribution')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('is_external', '=', 0)
        .where(e)
        .executeTakeFirstOrThrow()
    ).count;
  }

  const eb = expressionBuilder<DB, 'attribution'>();

  const incompleteManualAttributions = await attributionStats(
    eb.or([
      getFilterExpression(text.filters.incompleteCoordinates),
      getFilterExpression(text.filters.incompleteLegal),
    ]),
  );
  const totalManualAttributions = await attributionStats(sql`TRUE`);

  const attributionsOverview = [
    {
      name: 'needsReview' as const,
      count: await attributionStats(
        getFilterExpression(text.filters.needsReview),
      ),
    },
    {
      name: 'followUp' as const,
      count: await attributionStats(
        getFilterExpression(text.filters.needsFollowUp),
      ),
    },
    {
      name: 'firstParty' as const,
      count: await attributionStats(
        getFilterExpression(text.filters.firstParty),
      ),
    },
    {
      name: 'incomplete' as const,
      count: incompleteManualAttributions,
    },
    { name: 'total' as const, count: totalManualAttributions },
  ];

  const incompleteAttributions = [
    {
      name: 'complete',
      count: totalManualAttributions - incompleteManualAttributions,
    },
    { name: 'incomplete', count: incompleteManualAttributions },
  ];

  return {
    result: {
      attributionsOverview,
      incompleteAttributions,
    },
  };
}

export async function externalAttributionStatistics() {
  const LICENSE_LIMIT = 5;

  const mostFrequentLicenses = await getDb()
    // Get number of unresolved external attributions per stripped license name
    .with('attributions_per_license', (eb) =>
      eb
        .selectFrom('attribution')
        .select((eb) => [
          eb.ref('license_name').$notNull().as('license_name'),
          toCanonicalLicenseName(eb.ref('license_name')).as('stripped'),
          eb.fn.countAll<number>().as('count'),
        ])
        .where('is_external', '=', 1)
        .where('is_resolved', '=', 0)
        .where('license_name', 'is not', null)
        .where('license_name', '!=', '')
        .groupBy('stripped')
        .orderBy('count', 'desc'),
    )
    // Get first 5 entries
    .selectFrom((eb) =>
      eb
        .selectFrom('attributions_per_license')
        .select(['license_name as name', 'count'])
        .limit(LICENSE_LIMIT)
        .as('top_licenses'),
    )
    .selectAll()
    // Get sum of remaining entries
    .unionAll((eb) =>
      eb
        .selectFrom((eb) =>
          eb
            .selectFrom('attributions_per_license')
            .selectAll()
            .limit(-1) // No limit
            .offset(LICENSE_LIMIT)
            .as('rest'),
        )
        .select((eb) => [
          eb.val('Other').as('name'),
          eb.fn.sum<number>('count').as('count'),
        ]),
    )
    .execute()
    .then((rows) => rows.filter((row) => row.count !== null));

  const signalsByCriticality = await getDb()
    .selectFrom('attribution')
    .select((eb) => [
      eb
        .case()
        .when(
          eb.and([
            eb('license_name', 'is', null),
            eb(sql`data->>'licenseText'`, 'is', null),
          ]),
        )
        .then(null)
        .else(eb.ref('criticality'))
        .end()
        .as('name'), // null = no license
      eb.fn.countAll<number>().as('count'),
    ])
    .where('is_external', '=', 1)
    .where('is_resolved', '=', 0)
    .groupBy('name')
    .orderBy('name', 'desc')
    .execute();

  const signalsByClassification = await getDb()
    .selectFrom('attribution')
    .select((eb) => [
      eb
        .case()
        .when(
          eb.and([
            eb('license_name', 'is', null),
            eb(sql`data->>'licenseText'`, 'is', null),
          ]),
        )
        .then(null)
        .else(eb.ref('classification'))
        .end()
        .as('name'), // null = no license
      eb.fn.countAll<number>().as('count'),
    ])
    .where('is_external', '=', 1)
    .where('is_resolved', '=', 0)
    .groupBy('name')
    .orderBy('name', 'desc')
    .execute();

  return {
    result: {
      mostFrequentLicenses,
      signalsByCriticality,
      signalsByClassification,
    },
  };
}

export type LicenseTableRow = {
  licenseName: string | null;
  criticality: number;
  classification: number;
  perSource: { [key: string]: number };
  total: number;
};

export async function licenseTable() {
  const queryResult = await getDb()
    .selectFrom('attribution')
    .leftJoin(
      'source_for_attribution as sfa',
      'attribution.uuid',
      'sfa.attribution_uuid',
    )
    .leftJoin(
      'external_attribution_source as eas',
      'sfa.external_attribution_source_key',
      'eas.key',
    )
    .select((eb) => [
      'license_name',
      'criticality',
      'classification',
      eb.fn
        .coalesce('eas.name', 'sfa.external_attribution_source_key')
        .as('source_name'),
      eb.fn.countAll<number>().as('attribution_count'),
    ])
    .where('attribution.is_external', '=', 1)
    .where('attribution.is_resolved', '=', 0)
    .groupBy((eb) => [
      toCanonicalLicenseName(eb.ref('license_name')),
      'criticality',
      'classification',
      'source_name',
    ])
    .orderBy('license_name', (ob) => ob.asc().nullsLast())
    .orderBy('criticality', (ob) => ob.asc().nullsLast())
    .orderBy('classification', (ob) => ob.asc().nullsLast())
    .execute();

  const licenseTableRows: Array<LicenseTableRow> = [];
  const totals: Pick<LicenseTableRow, 'perSource' | 'total'> = {
    perSource: {},
    total: 0,
  };

  for (const queryRow of queryResult) {
    const licenseName = queryRow.license_name;
    const criticality = queryRow.criticality ?? 0;
    const classification = queryRow.classification ?? 0;
    const sourceName = queryRow.source_name ?? '-';

    let currentRow = licenseTableRows.at(-1);
    if (
      licenseName !== currentRow?.licenseName ||
      criticality !== currentRow.criticality ||
      classification !== currentRow.classification
    ) {
      currentRow = {
        licenseName,
        criticality,
        classification,
        perSource: {},
        total: 0,
      };
      licenseTableRows.push(currentRow);
    }

    currentRow.perSource[sourceName] = queryRow.attribution_count;
    currentRow.total += queryRow.attribution_count;

    if (!(sourceName in totals.perSource)) {
      totals.perSource[sourceName] = 0;
    }
    totals.perSource[sourceName] += queryRow.attribution_count;
    totals.total += queryRow.attribution_count;
  }

  return { result: { perLicense: licenseTableRows, totals } };
}
