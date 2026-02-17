// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExpressionBuilder, sql, SqlBool } from 'kysely';

import { getDb } from '../db/db';
import { DB, Resource } from '../db/generated/databaseTypes';
import { removeTrailingSlash } from './utils';

export type ResourceTreeNodeData = Awaited<
  ReturnType<typeof getResourceTree>
>['result']['treeNodes'][number];

export async function getResourceTree({
  search,
  expandedNodes,
  onAttributionUuids,
}: {
  search?: string;
  expandedNodes: Array<string> | 'expandAll';
  onAttributionUuids?: Array<string>;
}) {
  let query = getDb()
    .withRecursive('shown_resources', (eb) =>
      eb
        .selectFrom('resource as r')
        .select((sb) => [
          'id',
          'path',
          'max_descendant_id',
          'is_attribution_breakpoint',
          'is_file',
          'parent_id',
          sb.val(0).as('level'),
          sb.val('').as('sort_key'),
          sb.val(0).as('has_parent_with_manual_attribution'),
        ])
        .select((eb) => getTreeNodeProps(eb))
        .where('path', '=', '')
        .unionAll((eb) => {
          let query = eb
            .selectFrom('resource as r')
            .innerJoin('shown_resources as parent', 'parent.id', 'r.parent_id')
            .select([
              'r.id',
              'r.path',
              'r.max_descendant_id',
              'r.is_attribution_breakpoint',
              'r.is_file',
              'r.parent_id',
            ])
            .select(sql<number>`parent.level + 1`.as('level'))
            .select(
              sql<string>`parent.sort_key || '/' || r.is_file || r.name`.as(
                'sort_key',
              ),
            )
            .select(
              sql<number>`r.is_attribution_breakpoint = 0 AND (parent.has_manual_attribution OR parent.has_parent_with_manual_attribution)`.as(
                'has_parent_with_manual_attribution',
              ),
            )
            .select((eb) => getTreeNodeProps(eb));

          if (expandedNodes !== 'expandAll') {
            query = query.where(
              'parent.path',
              'in',
              expandedNodes.map((e) => removeTrailingSlash(e)),
            );
          }

          if (onAttributionUuids) {
            query = query.where((eb) =>
              eb.exists(
                eb
                  .selectFrom('resource_to_attribution as rta')
                  .selectAll()
                  .whereRef('r.id', '<=', 'rta.resource_id')
                  .whereRef('r.max_descendant_id', '>=', 'rta.resource_id')
                  .where('attribution_uuid', 'in', onAttributionUuids),
              ),
            );
          }
          return query;
        }),
    )
    .selectFrom('shown_resources')
    .selectAll()
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('resource as child')
            .selectAll()
            .whereRef('shown_resources.id', '=', 'child.parent_id'),
        )
        .as('is_expandable'),
    );

  if (search) {
    // This is the slowest part of the query and could be sped up using fts5: https://www.sqlite.org/fts5.html
    // But it's still <50ms for large files, so it's probably fine
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('resource')
          .selectAll()
          .where(sql<SqlBool>`path LIKE '%' || ${search} || '%'`)
          .whereRef('id', '>=', 'shown_resources.id')
          .whereRef('id', '<=', 'shown_resources.max_descendant_id'),
      ),
    );
  }

  query = query.orderBy('sort_key');

  const treeNodes = (await query.execute()).map((node) => ({
    id: node.path + (node.can_have_children ? '/' : ''), // For compatibility with legacy code
    labelText: node.name || '/',
    level: node.level,
    isExpandable: Boolean(node.is_expandable),
    isExpanded:
      expandedNodes === 'expandAll' ||
      expandedNodes.includes(node.path + (node.can_have_children ? '/' : '')),
    hasManualAttribution: Boolean(node.has_manual_attribution),
    hasExternalAttribution: Boolean(node.has_external_attribution),
    hasUnresolvedExternalAttribution: Boolean(
      node.has_unresolved_external_attribution,
    ),
    hasParentWithManualAttribution: Boolean(
      node.has_parent_with_manual_attribution,
    ),
    containsExternalAttribution: Boolean(node.contains_external_attribution),
    containsManualAttribution: Boolean(node.contains_manual_attribution),
    containsResourcesWithOnlyExternalAttribution: Boolean(
      node.contains_resource_with_only_external_attribution,
    ),
    canHaveChildren: Boolean(node.can_have_children),
    isAttributionBreakpoint: Boolean(node.is_attribution_breakpoint),
    isFile: Boolean(node.is_file),
    criticality: node.max_criticality_on_unresolved_external_attribution,
    classification: node.max_classification_on_unresolved_external_attribution,
  }));

  let totalCountQuery = getDb()
    .selectFrom('resource')
    .select((eb) => eb.fn.countAll<number>().as('count'));

  if (search) {
    totalCountQuery = totalCountQuery.where(
      sql<SqlBool>`path LIKE '%' || ${search} || '%'`,
    );
  }

  const totalCount = await totalCountQuery.executeTakeFirstOrThrow();

  return { result: { treeNodes, count: totalCount.count } };
}

type TreeNodeQueryType = DB & {
  r: Resource;
};
export function getTreeNodeProps(
  eb: ExpressionBuilder<TreeNodeQueryType, 'r'>,
) {
  return [
    eb.ref('r.name').as('name'),

    eb.ref('r.can_have_children').as('can_have_children'),

    eb
      .exists(
        eb
          .selectFrom('resource_to_attribution')
          .selectAll()
          .whereRef('r.id', '=', 'resource_id')
          .where('attribution_is_external', '=', 0),
      )
      .as('has_manual_attribution'),

    eb
      .exists(
        eb
          .selectFrom('resource_to_attribution')
          .selectAll()
          .whereRef('r.id', '=', 'resource_id')
          .where('attribution_is_external', '=', 1),
      )
      .as('has_external_attribution'),

    eb
      .exists(
        eb
          .selectFrom('resource_to_attribution')
          .selectAll()
          .whereRef('r.id', '=', 'resource_id')
          .where('attribution_is_external', '=', 1)
          .where((eb) =>
            eb.exists(
              eb
                .selectFrom('attribution')
                .selectAll()
                .whereRef('uuid', '=', 'attribution_uuid')
                .where('is_resolved', '=', 0),
            ),
          ),
      )
      .as('has_unresolved_external_attribution'),

    eb
      .selectFrom('resource_to_attribution as rta')
      .innerJoin('attribution as a', 'rta.attribution_uuid', 'a.uuid')
      .select((eb) => eb.fn.max<number>('a.criticality').as('max_criticality'))
      .whereRef('r.id', '=', 'resource_id')
      .where('attribution_is_external', '=', 1)
      .where('a.is_resolved', '=', 0)
      .as('max_criticality_on_unresolved_external_attribution'),

    eb
      .selectFrom('resource_to_attribution as rta')
      .innerJoin('attribution as a', 'rta.attribution_uuid', 'a.uuid')
      .select((eb) =>
        eb.fn.max<number>('a.classification').as('max_classification'),
      )
      .whereRef('r.id', '=', 'resource_id')
      .where('attribution_is_external', '=', 1)
      .where('a.is_resolved', '=', 0)
      .as('max_classification_on_unresolved_external_attribution'),

    eb
      .exists(
        eb
          .selectFrom('resource_to_attribution')
          .selectAll()
          .whereRef('r.id', '<', 'resource_id')
          .whereRef('resource_id', '<=', 'r.max_descendant_id')
          .where('attribution_is_external', '=', 1),
      )
      .as('contains_external_attribution'),

    eb
      .exists(
        eb
          .selectFrom('resource_to_attribution')
          .selectAll()
          .whereRef('r.id', '<', 'resource_id')
          .whereRef('resource_id', '<=', 'r.max_descendant_id')
          .where('attribution_is_external', '=', 0),
      )
      .as('contains_manual_attribution'),

    eb
      .exists(
        eb
          .selectFrom('resource_to_attribution as with_external')
          .selectAll()
          .whereRef('r.id', '<', 'with_external.resource_id')
          .whereRef('with_external.resource_id', '<=', 'r.max_descendant_id')
          .where('with_external.attribution_is_external', '=', 1)
          .where((eb) =>
            eb.not(
              eb.exists(
                eb
                  .selectFrom('resource_to_attribution as with_manual')
                  .selectAll()
                  .where('with_manual.attribution_is_external', '=', 0)
                  .whereRef(
                    'with_manual.resource_id',
                    '=',
                    'with_external.resource_id',
                  ),
              ),
            ),
          ),
      )
      .as('contains_resource_with_only_external_attribution'),
  ];
}
