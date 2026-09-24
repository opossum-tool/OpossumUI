// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ExpressionBuilder, sql, type Transaction } from 'kysely';

import { getDb } from '../db/db';
import type { DB, Resource } from '../db/generated/databaseTypes';
import { jsonArraySelection } from '../db/json-array-selection';
import { withFilteredResourcesTable } from './resource-tree-cache';
import {
  type FilteredTable,
  getFilteredResourcesQuery,
  getMatchesFiltersExpression,
  getSearchMatchExpression,
  getVisibleWithFiltersExpression,
  hasActiveFilters,
  type LicenseFilter,
  type ResourceTreeFilters,
} from './resourceTreeFilters';
import { getResourceOrThrow, removeTrailingSlash } from './utils';

export interface ResourceTreeNodeBase {
  id: string;
  labelText: string;
  level: number;
  isExpandable: boolean;
  isExpanded: boolean;
  canHaveChildren: boolean;
  isAttributionBreakpoint: boolean;
  isFile: boolean;
  isReadonly: boolean;
  matchesFilters: boolean;
}

export type ResourceTreeNodeData = ResourceTreeNodeBase & {
  hasManualAttribution: boolean;
  hasExternalAttribution: boolean;
  hasUnresolvedExternalAttribution: boolean;
  hasParentWithManualAttribution: boolean;
  containsExternalAttribution: boolean;
  containsManualAttribution: boolean;
  containsResourcesWithOnlyExternalAttribution: boolean;
  criticality: number | null;
  classification: number | null;
};

type ResourceTreeResult<T> = {
  result: {
    treeNodes: Array<T>;
    count: number;
    belowSelectedResource?: number;
  };
};

export type LinkedResourceTreeNodeData = ResourceTreeNodeBase & {
  isDirectlyLinked: boolean;
};

export async function getResourceTree({
  search,
  expandedNodes,
  onlyUnreviewedFiles,
  licenseFilter,
  onAttributionUuids,
  selectedResourcePath,
  onlyWritable,
}: ResourceTreeFilters & {
  expandedNodes: Array<string> | 'expandAll';
  selectedResourcePath?: string;
}): Promise<ResourceTreeResult<ResourceTreeNodeData>> {
  const queryResult = await getResourceTreeWithProjection(
    {
      search,
      expandedNodes,
      onlyUnreviewedFiles,
      licenseFilter,
      onAttributionUuids,
      selectedResourcePath,
      onlyWritable,
    },
    'full',
  );

  return {
    result: {
      ...queryResult.result,
      treeNodes: queryResult.result.treeNodes.map(
        (node): ResourceTreeNodeData => ({
          ...mapCommonNode(node, {
            expandedNodeSet: queryResult.expandedNodeSet,
            onAttributionUuids,
            search,
          }),
          hasManualAttribution: Boolean(node.has_manual_attribution),
          hasExternalAttribution: Boolean(node.has_external_attribution),
          hasUnresolvedExternalAttribution: Boolean(
            node.has_unresolved_external_attribution,
          ),
          hasParentWithManualAttribution: Boolean(
            node.has_parent_with_manual_attribution,
          ),
          containsExternalAttribution: Boolean(
            node.contains_external_attribution,
          ),
          containsManualAttribution: Boolean(node.contains_manual_attribution),
          containsResourcesWithOnlyExternalAttribution: Boolean(
            node.contains_resource_with_only_external_attribution,
          ),
          criticality: node.max_criticality_on_unresolved_external_attribution,
          classification:
            node.max_classification_on_unresolved_external_attribution,
        }),
      ),
    },
  };
}

export async function getLinkedResourceTree({
  search,
  expandedNodes,
  onAttributionUuids,
  selectedResourcePath,
  onlyWritable,
}: {
  onAttributionUuids: Array<string>;
  expandedNodes: Array<string> | 'expandAll';
  search?: string;
  selectedResourcePath?: string;
  onlyWritable?: boolean;
}): Promise<ResourceTreeResult<LinkedResourceTreeNodeData>> {
  const queryResult = await getResourceTreeWithProjection(
    {
      search,
      expandedNodes,
      onAttributionUuids,
      selectedResourcePath,
      onlyWritable,
    },
    'linked',
  );

  return {
    result: {
      ...queryResult.result,
      treeNodes: queryResult.result.treeNodes.map((node) => ({
        ...mapCommonNode(node, {
          expandedNodeSet: queryResult.expandedNodeSet,
          onAttributionUuids,
          search,
        }),
        isDirectlyLinked: Boolean(node.is_directly_linked),
      })),
    },
  };
}

async function getResourceTreeWithProjection(
  {
    search,
    expandedNodes,
    onlyUnreviewedFiles,
    licenseFilter,
    onAttributionUuids,
    selectedResourcePath,
    onlyWritable,
  }: ResourceTreeFilters & {
    expandedNodes: Array<string> | 'expandAll';
    selectedResourcePath?: string;
  },
  projection: 'full' | 'linked',
) {
  const expandedNodeSet: ExpandedNodeSet =
    expandedNodes === 'expandAll'
      ? 'expandAll'
      : new Set(expandedNodes.map((path) => removeTrailingSlash(path)));
  const db = getDb();
  const filters = {
    licenseFilter,
    onlyUnreviewedFiles,
    onAttributionUuids,
    search,
    onlyWritable,
  };
  const filtersAreActive = hasActiveFilters(filters);
  const runQuery = async (trx: Transaction<DB>, cacheId?: number) => {
    /*
     * filtered_resources contains the resources included by the active filters.
     * Without active filters, counts read from `resource` directly.
     */

    const resourceIdsTable = filtersAreActive
      ? 'filtered_resources'
      : 'resource';
    const total = (
      await trx
        .$extendTables<FilteredTable>()
        .selectFrom(resourceIdsTable)
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .$if(filtersAreActive, (query) =>
          query.where('cache_id', '=', cacheId!),
        )
        .executeTakeFirstOrThrow()
    ).count;

    let belowSelectedResourceTotal = undefined;
    if (selectedResourcePath) {
      const selectedResource = await getResourceOrThrow(
        trx,
        selectedResourcePath,
      );

      belowSelectedResourceTotal = (
        await trx
          .$extendTables<FilteredTable>()
          .selectFrom(resourceIdsTable)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .$if(filtersAreActive, (query) =>
            query.where('cache_id', '=', cacheId!),
          )
          .where((eb) =>
            eb.between(
              'id',
              selectedResource.id,
              selectedResource.max_descendant_id,
            ),
          )
          .executeTakeFirstOrThrow()
      ).count;
    }

    if (total === 0) {
      return {
        result: { treeNodes: [], count: 0 },
        expandedNodeSet,
      };
    }

    let query = trx
      .withRecursive('shown_resources', (eb) =>
        eb
          // Base case: Include /
          .selectFrom('resource as r')
          .select((sb) => [
            'id',
            'path',
            'max_descendant_id',
            'is_attribution_breakpoint',
            'is_file',
            'is_readonly',
            'parent_id',
            sb.val(0).as('level'),
            ...(projection === 'full'
              ? [sb.val(0).as('has_parent_with_manual_attribution')]
              : []),
          ])
          .select((eb) => getTreeNodeProps(eb, projection, onAttributionUuids))
          .select([
            sql`FALSE`.as('matches_filters'),
            sql`FALSE`.as('ancestor_matches_filters'),
          ])
          .where('path', '=', '')

          // Recursion: If parent is in shown resource, then include its children
          .unionAll((eb) => {
            let query = eb
              .selectFrom('resource as r')
              .innerJoin(
                'shown_resources as parent',
                'parent.id',
                'r.parent_id',
              )
              .select([
                'r.id',
                'r.path',
                'r.max_descendant_id',
                'r.is_attribution_breakpoint',
                'r.is_file',
                'r.is_readonly',
                'r.parent_id',
                sql<number>`parent.level + 1`.as('level'),
                ...(projection === 'full'
                  ? [
                      sql<number>`r.is_attribution_breakpoint = 0 AND (parent.has_manual_attribution OR parent.has_parent_with_manual_attribution)`.as(
                        'has_parent_with_manual_attribution',
                      ),
                    ]
                  : []),
              ])
              .select((eb) =>
                getTreeNodeProps(eb, projection, onAttributionUuids),
              )
              .select((eb) => {
                if (!filtersAreActive) {
                  return sql`FALSE`.as('matches_filters');
                }

                return getMatchesFiltersExpression({
                  id: eb.ref('r.id'),
                  path: eb.ref('r.path'),
                  name: eb.ref('r.name'),
                  filters,
                  cacheId: cacheId!,
                }).as('matches_filters');
              })
              .select((eb) =>
                eb
                  .or([
                    eb.ref('parent.matches_filters'),
                    eb.ref('parent.ancestor_matches_filters'),
                  ])
                  .as('ancestor_matches_filters'),
              );

            if (expandedNodeSet !== 'expandAll') {
              query = query.where(
                'parent.path',
                'in',
                jsonArraySelection([...expandedNodeSet]),
              );
            }

            if (filtersAreActive) {
              query = query.where((eb) =>
                getVisibleWithFiltersExpression({
                  id: eb.ref('r.id'),
                  maxDescendantId: eb.ref('r.max_descendant_id'),
                  hasEditableDescendant: eb.ref('r.has_editable_descendant'),
                  inheritedMatch: eb.or([
                    eb.ref('parent.matches_filters'),
                    eb.ref('parent.ancestor_matches_filters'),
                  ]),
                  filters,
                  cacheId: cacheId!,
                }),
              );
            }

            return query;
          }),
      )
      .selectFrom('shown_resources')
      .selectAll()
      .select((eb) =>
        eb
          .exists((eb) =>
            eb
              .selectFrom('resource as child')
              .selectAll()
              .whereRef('child.parent_id', '=', 'shown_resources.id')
              .$if(Boolean(onlyWritable), (query) =>
                query.where((eb) => {
                  return getVisibleWithFiltersExpression({
                    id: eb.ref('child.id'),
                    maxDescendantId: eb.ref('child.max_descendant_id'),
                    hasEditableDescendant: eb.ref(
                      'child.has_editable_descendant',
                    ),
                    inheritedMatch: eb.or([
                      eb('shown_resources.matches_filters', '=', 1),
                      eb('shown_resources.ancestor_matches_filters', '=', 1),
                    ]),
                    filters,
                    cacheId: cacheId!,
                  });
                }),
              ),
          )
          .as('is_expandable'),
      )
      .select((eb) =>
        getSearchMatchExpression(
          eb,
          eb.ref('shown_resources.path'),
          eb.ref('shown_resources.name'),
          search,
        ).as('highlight_matches'),
      );

    query = query.orderBy('id');

    const treeNodes = await query.execute();

    return {
      result: {
        treeNodes,
        count: total,
        belowSelectedResource: belowSelectedResourceTotal,
      },
      expandedNodeSet,
    };
  };
  return filtersAreActive
    ? withFilteredResourcesTable(filters, runQuery)
    : db.transaction().execute(runQuery);
}

type ResourceTreeQueryResult = Awaited<
  ReturnType<typeof getResourceTreeWithProjection>
>;
type ResourceTreeQueryRow =
  ResourceTreeQueryResult['result']['treeNodes'][number];
type ExpandedNodeSet = Set<string> | 'expandAll';

function mapCommonNode(
  node: ResourceTreeQueryRow,
  {
    expandedNodeSet,
    onAttributionUuids,
    search,
  }: Pick<ResourceTreeFilters, 'onAttributionUuids' | 'search'> & {
    expandedNodeSet: ExpandedNodeSet;
  },
): ResourceTreeNodeBase {
  return {
    id: node.path + (node.can_have_children ? '/' : ''), // For compatibility with legacy code
    labelText: node.name || '/',
    level: node.level,
    isExpandable: Boolean(node.is_expandable),
    isExpanded:
      expandedNodeSet === 'expandAll' || expandedNodeSet.has(node.path),
    canHaveChildren: Boolean(node.can_have_children),
    isAttributionBreakpoint: Boolean(node.is_attribution_breakpoint),
    isFile: Boolean(node.is_file),
    isReadonly: Boolean(node.is_readonly),
    matchesFilters: onAttributionUuids
      ? Boolean(search && node.highlight_matches)
      : Boolean(node.matches_filters),
  };
}

export async function getResourceTreeUnreviewedCount({
  licenseFilter,
  onAttributionUuids,
  search,
}: {
  licenseFilter?: LicenseFilter;
  onAttributionUuids?: Array<string>;
  search?: string;
}) {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const count = await trx
        .selectFrom(
          getFilteredResourcesQuery(trx, {
            licenseFilter,
            onlyUnreviewedFiles: true,
            onAttributionUuids,
            search,
          }).as('filtered_resources'),
        )
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow();

      return { result: count.count };
    });
}

type TreeNodeQueryType = DB & {
  r: Resource;
};

function getTreeNodeProps(
  eb: ExpressionBuilder<TreeNodeQueryType, 'r'>,
  projection: 'full' | 'linked',
  onAttributionUuids?: Array<string>,
) {
  const commonProps = [
    eb.ref('r.name').as('name'),

    eb.ref('r.can_have_children').as('can_have_children'),
  ];
  if (projection === 'linked') {
    // Filtering uses IN to find linked resources across the project. Here,
    // EXISTS only checks returned tree nodes, avoiding the cost of building
    // the full linked-ID set. Benchmarks favor this for a single attribution.
    return [
      ...commonProps,
      eb
        .exists(
          eb
            .selectFrom('resource_to_attribution')
            .selectAll()
            .whereRef('r.id', '=', 'resource_id')
            .where(
              'attribution_uuid',
              'in',
              jsonArraySelection(onAttributionUuids ?? []),
            ),
        )
        .as('is_directly_linked'),
    ];
  }
  return [
    ...commonProps,

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
