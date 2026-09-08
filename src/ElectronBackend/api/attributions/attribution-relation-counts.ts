// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type Kysely, sql } from 'kysely';

import type {
  AttributionRelationCountRequest,
  AttributionSourceGroupCount,
} from '../../../shared/attribution-result-set';
import type { Relation } from '../../../shared/shared-types';
import { getDb } from '../../db/db';
import type { DB } from '../../db/generated/databaseTypes';
import { EDITABLE_ATTRIBUTION_RESOURCE_ACCESS } from '../../types/types';
import {
  backendToFrontendRelationship,
  getAttributionResultSetContext,
  getAttributionSourceNameExpression,
  getAttributionSourcePriorityExpression,
  getFilteredQuery,
} from './attribution-list-query-utils';

export type AttributionRelationCount = {
  visibleCount: number;
  editableCount: number;
  sourceGroups?: Array<AttributionSourceGroupCount>;
};

type RelationCountRow = {
  relationship: keyof typeof backendToFrontendRelationship;
  source_group_name: string;
  visible_count: number;
  editable_count: number | null;
};

async function getRelationCounts(
  trx: Kysely<DB>,
  props: AttributionRelationCountRequest,
  resource: { id: number; max_descendant_id: number } | undefined,
  closestAncestor: number | undefined,
): Promise<Partial<Record<Relation, AttributionRelationCount>>> {
  let query = getFilteredQuery(
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
  ).select((eb) => [
    eb.fn.countAll<number>().as('visible_count'),
    sql<number>`sum(case when resource_access in (${sql.join(
      EDITABLE_ATTRIBUTION_RESOURCE_ACCESS,
    )}) then 1 else 0 end)`.as('editable_count'),
  ]);

  if (props.external) {
    query = query
      .select((eb) => [
        getAttributionSourceNameExpression(eb).as('source_group_name'),
      ])
      .groupBy(['relationship', 'source_name'])
      .orderBy('relationship')
      .orderBy(getAttributionSourcePriorityExpression, 'desc')
      .orderBy(getAttributionSourceNameExpression, 'asc');
  } else {
    query = query.groupBy('relationship');
  }

  const rows = (await query.execute()) as Array<RelationCountRow>;
  const result = new Map<Relation, AttributionRelationCount>();

  for (const row of rows) {
    const relation = backendToFrontendRelationship[row.relationship];
    const current = result.get(relation) ?? {
      visibleCount: 0,
      editableCount: 0,
      ...(props.external ? { sourceGroups: [] } : {}),
    };
    current.visibleCount += row.visible_count;
    current.editableCount += row.editable_count ?? 0;

    if (props.external) {
      const name = row.source_group_name;
      const sourceGroups = current.sourceGroups ?? [];
      const sourceGroup = sourceGroups.find((group) => group.name === name);
      if (sourceGroup) {
        sourceGroup.visibleCount += row.visible_count;
        sourceGroup.editableCount += row.editable_count ?? 0;
      } else {
        sourceGroups.push({
          name,
          visibleCount: row.visible_count,
          editableCount: row.editable_count ?? 0,
        });
      }
      current.sourceGroups = sourceGroups;
    }

    result.set(relation, current);
  }

  return Object.fromEntries(
    [...result.entries()].map(([relation, count]) => [
      relation,
      {
        visibleCount: count.visibleCount,
        editableCount: count.editableCount,
        ...(count.sourceGroups
          ? {
              sourceGroups: count.sourceGroups,
            }
          : {}),
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
