// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type Kysely, sql } from 'kysely';

import {
  type Attributions,
  type PackageInfo,
  type ResourcesToAttributions,
  type SaveFileArgs,
} from '../../shared/shared-types';
import { getDb } from '../db/db';
import { type DB } from '../db/generated/databaseTypes';

export async function getPreferredOverOriginIds(trxOrDb: Kysely<DB>) {
  const preferredOverResult = await trxOrDb
    .with(
      (cte) => cte('overridden_resources').materialized(),
      (db) =>
        db
          .selectFrom('attribution as preferred')
          .innerJoin(
            'resource_to_attribution as has_preferred',
            'preferred.uuid',
            'has_preferred.attribution_uuid',
          )
          .innerJoin('cwa', 'cwa.manual', 'has_preferred.resource_id')
          .select(['preferred.uuid as attribution_uuid', 'cwa.resource_id'])
          .where('is_external', '=', 0)
          .where('preferred', '=', 1),
    )
    .selectFrom('overridden_resources')
    .select([
      'overridden_resources.attribution_uuid',
      sql<string>`overridden.data->'originIds'`.as('overridden_origin_ids'),
    ])
    .innerJoin(
      'resource_to_attribution as has_overridden',
      'overridden_resources.resource_id',
      'has_overridden.resource_id',
    )
    .innerJoin(
      'attribution as overridden',
      'overridden.uuid',
      'has_overridden.attribution_uuid',
    )
    .innerJoin(
      'source_for_attribution as overridden_source_assoc',
      'overridden.uuid',
      'overridden_source_assoc.attribution_uuid',
    )
    .innerJoin(
      'external_attribution_source as overridden_source',
      'overridden_source_assoc.external_attribution_source_key',
      'overridden_source.key',
    )
    .where('overridden.is_external', '=', 1)
    .where('overridden_source.is_relevant_for_preferred', '=', 1)
    .execute();

  const preferredOver: Record<string, Set<string>> = {};

  for (const row of preferredOverResult) {
    if (!(row.attribution_uuid in preferredOver)) {
      preferredOver[row.attribution_uuid] = new Set();
    }

    (JSON.parse(row.overridden_origin_ids) as Array<string>).forEach((i) =>
      preferredOver[row.attribution_uuid].add(i),
    );
  }

  return Object.fromEntries(
    Object.entries(preferredOver).map(([key, value]) => [
      key,
      Array.from(value),
    ]),
  );
}

export async function getSaveFileArgs(): Promise<{ result: SaveFileArgs }> {
  const queryResults = await getDb()
    .transaction()
    .execute(async (trx) => {
      const manualAttributionsResult = await trx
        .selectFrom('attribution')
        .select(['uuid', 'data'])
        .where('is_external', '=', 0)
        .execute();

      const preferredOver = await getPreferredOverOriginIds(trx);

      const resourcesToAttributionsResult = await trx
        .selectFrom('resource_to_attribution')
        .innerJoin('resource', 'id', 'resource_id')
        .select([
          sql<string>`path || IF(is_file, '', '/')`.as('path'),
          sql<string>`json_group_array(attribution_uuid)`.as(
            'attribution_uuids',
          ),
        ])
        .where('attribution_is_external', '=', 0)
        .groupBy('resource_id')
        .execute();

      const resolvedExternalAttributionsResult = await trx
        .selectFrom('attribution')
        .select('uuid')
        .where('is_resolved', '=', 1)
        .where('is_external', '=', 1)
        .execute();

      return {
        manualAttributionsResult,
        preferredOver,
        resourcesToAttributionsResult,
        resolvedExternalAttributionsResult,
      };
    });

  const manualAttributions: Attributions = Object.fromEntries(
    queryResults.manualAttributionsResult.map(({ uuid, data }) => [
      uuid,
      { ...(JSON.parse(data) as PackageInfo), id: uuid },
    ]),
  );

  for (const id of Object.keys(manualAttributions)) {
    manualAttributions[id].preferredOverOriginIds =
      queryResults.preferredOver[id];
  }

  const resourcesToAttributions: ResourcesToAttributions = Object.fromEntries(
    queryResults.resourcesToAttributionsResult.map((val) => [
      val.path,
      JSON.parse(val.attribution_uuids) as Array<string>,
    ]),
  );
  const resolvedExternalAttributions = new Set(
    queryResults.resolvedExternalAttributionsResult.map(({ uuid }) => uuid),
  );

  return {
    result: {
      manualAttributions,
      resourcesToAttributions,
      resolvedExternalAttributions,
    },
  };
}
