// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expressionBuilder, OperandExpression, sql, SqlBool } from 'kysely';

import { text } from '../../shared/text';
import { getDb } from '../db/db';
import { DB } from '../db/generated/databaseTypes';
import { getFilterExpression } from './filters';
import { canonicalLicenseName } from './utils';

export async function statistics() {
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

  const LICENSE_LIMIT = 5;

  const mostFrequentLicenses = await getDb()
    // Get number of unresolved external attributions per stripped license name
    .with('attributions_per_license', (eb) =>
      eb
        .selectFrom('attribution')
        .select((eb) => [
          eb.ref('license_name').$notNull().as('license_name'),
          canonicalLicenseName(eb.ref('license_name')).as('stripped'),
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
    .execute();

  const signalsByCriticality = await getDb()
    .selectFrom('attribution')
    .select((eb) => [
      eb.fn.coalesce('criticality', eb.lit(0)).as('name'),
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
      eb.fn.coalesce('classification', eb.lit(0)).as('name'),
      eb.fn.countAll<number>().as('count'),
    ])
    .where('is_external', '=', 1)
    .where('is_resolved', '=', 0)
    .groupBy('name')
    .orderBy('name', 'desc')
    .execute();

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
      mostFrequentLicenses,
      signalsByCriticality,
      signalsByClassification,
      incompleteAttributions,
    },
  };
}
