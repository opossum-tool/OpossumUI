// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type Kysely, sql } from 'kysely';

import type { AttributionRelationCountRequest } from '../../../shared/attribution-result-set';
import type { Relation } from '../../../shared/shared-types';
import { getDb } from '../../db/db';
import type { DB } from '../../db/generated/databaseTypes';
import { EDITABLE_ATTRIBUTION_RESOURCE_ACCESS } from '../../types/types';
import {
  backendToFrontendRelationship,
  getAttributionResultSetContext,
  getFilteredQuery,
} from './attribution-list-query-utils';

export type AttributionRelationCount = {
  visibleCount: number;
  editableCount: number;
};

async function getRelationCounts(
  trx: Kysely<DB>,
  props: AttributionRelationCountRequest,
  resource: { id: number; max_descendant_id: number } | undefined,
  closestAncestor: number | undefined,
): Promise<Partial<Record<Relation, AttributionRelationCount>>> {
  const rows = await getFilteredQuery(
    trx,
    {
      ...props,
      relation: undefined,
      includeReadonly: true,
    },
    resource,
    closestAncestor,
    false,
    false,
  )
    .select((eb) => [
      eb.fn.countAll<number>().as('visible_count'),
      sql<number>`sum(case when resource_access in (${sql.join(
        EDITABLE_ATTRIBUTION_RESOURCE_ACCESS,
      )}) then 1 else 0 end)`.as('editable_count'),
    ])
    .groupBy('relationship')
    .execute();

  return Object.fromEntries(
    rows.map((row) => [
      backendToFrontendRelationship[row.relationship],
      {
        visibleCount: row.visible_count,
        editableCount: row.editable_count,
      },
    ]),
  );
}

export async function listAttributionRelationCounts(
  props: AttributionRelationCountRequest,
): Promise<{
  result: Partial<Record<Relation, AttributionRelationCount>>;
}> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { resource, closestAncestor } =
        await getAttributionResultSetContext(trx, props);
      return getRelationCounts(trx, props, resource, closestAncestor);
    });

  return { result };
}
