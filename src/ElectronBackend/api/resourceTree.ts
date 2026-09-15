// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Expression,
  expressionBuilder,
  type ExpressionBuilder,
  type Kysely,
  sql,
  type SqlBool,
  type Transaction,
} from 'kysely';

import { getDb } from '../db/db';
import type { DB, Resource } from '../db/generated/databaseTypes';
import {
  getOnlyExternalFilesQuery,
  getOnlyPreSelectedManualFilesQuery,
} from './progressBarUtils';
import {
  GET_LEGACY_RESOURCE_PATH,
  getResourceOrThrow,
  removeTrailingSlash,
  toCanonicalLicenseName,
} from './utils';

export type ResourceTreeNodeData = Awaited<
  ReturnType<typeof getResourceTree>
>['result']['treeNodes'][number];

const FILTERED_RESOURCE_TEMP_TABLE = 'filtered_resources';
export type FilteredTable = { filtered_resources: { id: number } };
export type LicenseFilter = { licenseName: string; external: boolean };
export type ResourceTreeFilters = {
  search?: string;
  onlyUnreviewedFiles?: boolean;
  licenseFilter?: LicenseFilter;
  onAttributionUuids?: Array<string>;
  onlyWritable?: boolean;
};
type FilteredResourcesCacheEntry = { key?: string };
const filteredResourcesCaches = new WeakMap<
  Kysely<DB>,
  FilteredResourcesCacheEntry
>();

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
}) {
  const db = getDb();
  const filters = {
    licenseFilter,
    onlyUnreviewedFiles,
    onAttributionUuids,
    search,
    onlyWritable,
  };
  const filtersAreActive = hasActiveFilters(filters);
  const runQuery = async (trx: Transaction<DB>) => {
    /*
     * FILTERED_RESOURCE_TEMP_TABLE contains the resources included by the active filters.
     * Without active filters, counts read from `resource` directly.
     */

    const resourceIdsTable = filtersAreActive
      ? FILTERED_RESOURCE_TEMP_TABLE
      : 'resource';
    const total = (
      await trx
        .$extendTables<FilteredTable>()
        .selectFrom(resourceIdsTable)
        .select((eb) => eb.fn.countAll<number>().as('count'))
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
      return { result: { treeNodes: [], count: 0 } };
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
            sb.val(0).as('has_parent_with_manual_attribution'),
          ])
          .select((eb) => getTreeNodeProps(eb))
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
                sql<number>`r.is_attribution_breakpoint = 0 AND (parent.has_manual_attribution OR parent.has_parent_with_manual_attribution)`.as(
                  'has_parent_with_manual_attribution',
                ),
              ])
              .select((eb) => getTreeNodeProps(eb))
              .select((eb) => {
                if (!filtersAreActive) {
                  return sql`FALSE`.as('matches_filters');
                }

                return getMatchesFiltersExpression({
                  id: eb.ref('r.id'),
                  path: eb.ref('r.path'),
                  name: eb.ref('r.name'),
                  filters,
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

            if (expandedNodes !== 'expandAll') {
              query = query.where(
                'parent.path',
                'in',
                expandedNodes.map((e) => removeTrailingSlash(e)),
              );
            }

            if (filtersAreActive) {
              query = query.where((eb) =>
                getVisibleWithFiltersExpression({
                  id: eb.ref('r.id'),
                  maxDescendantId: eb.ref('r.max_descendant_id'),
                  isReadonly: eb.ref('r.is_readonly'),
                  inheritedMatch: eb.or([
                    eb.ref('parent.matches_filters'),
                    eb.ref('parent.ancestor_matches_filters'),
                  ]),
                  filters,
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
                    isReadonly: eb.ref('child.is_readonly'),
                    inheritedMatch: eb.or([
                      eb('shown_resources.matches_filters', '=', 1),
                      eb('shown_resources.ancestor_matches_filters', '=', 1),
                    ]),
                    filters,
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
      isReadonly: Boolean(node.is_readonly),
      criticality: node.max_criticality_on_unresolved_external_attribution,
      classification:
        node.max_classification_on_unresolved_external_attribution,
      matchesFilters: onAttributionUuids
        ? Boolean(search && node.highlight_matches)
        : Boolean(node.matches_filters),
    }));

    return {
      result: {
        treeNodes,
        count: total,
        belowSelectedResource: belowSelectedResourceTotal,
      },
    };
  };
  return filtersAreActive
    ? withFilteredResourcesTable(filters, runQuery)
    : db.transaction().execute(runQuery);
}

function getFilterKey(filters: ResourceTreeFilters) {
  return JSON.stringify([
    filters.search,
    filters.licenseFilter,
    filters.onlyUnreviewedFiles,
    filters.onAttributionUuids,
    filters.onlyWritable,
  ]);
}

export function invalidateFilteredResourcesCache(db: Kysely<DB>) {
  filteredResourcesCaches.delete(db);
}

function hasActiveNonSearchFilters(filters: ResourceTreeFilters) {
  return Boolean(
    filters.licenseFilter ||
    filters.onAttributionUuids ||
    filters.onlyUnreviewedFiles ||
    filters.onlyWritable,
  );
}

function hasActiveFilters(filters: ResourceTreeFilters) {
  return Boolean(filters.search || hasActiveNonSearchFilters(filters));
}

async function prepareFilteredResourcesTable(
  trx: Transaction<DB>,
  filters: ResourceTreeFilters,
): Promise<void> {
  await trx.schema.dropTable(FILTERED_RESOURCE_TEMP_TABLE).ifExists().execute();
  await trx.schema
    .createTable(FILTERED_RESOURCE_TEMP_TABLE)
    .temporary()
    .as(getFilteredResourcesQuery(trx, filters))
    .execute();
  await trx.schema
    .createIndex('temp.filtered_resources_id_idx')
    .on(FILTERED_RESOURCE_TEMP_TABLE)
    .column('id')
    .execute();
}

export async function withFilteredResourcesTable<T>(
  filters: ResourceTreeFilters,
  query: (trx: Transaction<DB>) => Promise<T>,
): Promise<T> {
  const db = getDb();
  const key = getFilterKey(filters);
  return db.transaction().execute(async (trx) => {
    // The transaction may have waited behind another read that prepared this
    // table, so inspect the cache only after it has acquired the connection.
    if (filteredResourcesCaches.get(db)?.key === key) {
      return query(trx);
    }

    const entry: FilteredResourcesCacheEntry = {};
    filteredResourcesCaches.set(db, entry);
    await prepareFilteredResourcesTable(trx, filters);
    const result = await query(trx);
    entry.key = key;
    return result;
  });
}

function filteredResourcesContainIdBetween(
  a: Expression<number>,
  b: Expression<number>,
) {
  const eb = expressionBuilder<DB & FilteredTable>();
  return eb.exists((eb) =>
    eb
      .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
      .selectAll()
      .where((eb) => eb.between('id', a, b)),
  );
}

function getMatchesFiltersExpression({
  id,
  path,
  name,
  filters,
}: {
  id: Expression<number>;
  path: Expression<string>;
  name: Expression<string>;
  filters: ResourceTreeFilters;
}) {
  const eb = expressionBuilder<DB & FilteredTable>();
  if (hasActiveNonSearchFilters(filters)) {
    return filteredResourcesContainIdBetween(id, id);
  }
  return getSearchMatchExpression(eb, path, name, filters.search);
}

function getSearchMatchExpression<TDB, TB extends keyof TDB & string>(
  eb: ExpressionBuilder<TDB, TB>,
  path: Expression<string>,
  name: Expression<string>,
  search: string | undefined,
) {
  const normalizedSearch = removeTrailingSlash(search ?? '');
  const lastSearchPart = normalizedSearch.split('/').at(-1);

  return eb.and([
    eb(path, 'like', `%${normalizedSearch}%`),
    eb(name, 'like', `%${lastSearchPart}%`),
  ]);
}

function getVisibleWithFiltersExpression({
  id,
  maxDescendantId,
  isReadonly,
  inheritedMatch,
  filters,
}: {
  id: Expression<number>;
  maxDescendantId: Expression<number>;
  isReadonly: Expression<number>;
  inheritedMatch: Expression<SqlBool>;
  filters: ResourceTreeFilters;
}) {
  const eb = expressionBuilder<DB & FilteredTable>();
  return eb.or([
    filteredResourcesContainIdBetween(id, maxDescendantId),
    filters.onlyWritable
      ? eb.and([eb(isReadonly, '=', 0), inheritedMatch])
      : inheritedMatch,
  ]);
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

function getFilteredResourcesQuery(
  trx: Transaction<DB>,
  {
    licenseFilter,
    onlyUnreviewedFiles,
    onAttributionUuids,
    search,
    onlyWritable,
  }: ResourceTreeFilters,
) {
  let query = trx.selectFrom('resource as r').select('r.id as id');

  if (search) {
    query = query.where('r.path', 'like', `%${removeTrailingSlash(search)}%`);
  }

  if (licenseFilter) {
    query = query.where('r.id', 'in', (eb) =>
      eb
        .selectFrom('attribution as a')
        .innerJoin(
          'resource_to_attribution as rta',
          'rta.attribution_uuid',
          'a.uuid',
        )
        .select('rta.resource_id')
        .where('a.is_external', '=', Number(licenseFilter.external))
        .where(
          'a.canonical_license_name',
          '=',
          toCanonicalLicenseName(licenseFilter.licenseName),
        ),
    );
  }

  if (onAttributionUuids) {
    query = query.where((eb) =>
      eb.exists((eb) =>
        eb
          .selectFrom('resource_to_attribution as rta')
          .select('rta.resource_id')
          .whereRef('rta.resource_id', '=', 'r.id')
          .where('rta.attribution_uuid', 'in', onAttributionUuids),
      ),
    );
  }

  if (onlyUnreviewedFiles) {
    const filterExpressionBuilder = expressionBuilder<
      DB,
      'closest_attributed_ancestors'
    >();
    query = query
      .where((eb) =>
        eb.or([
          eb('r.id', 'in', getOnlyExternalFilesQuery(filterExpressionBuilder)),
          eb(
            'r.id',
            'in',
            getOnlyPreSelectedManualFilesQuery(filterExpressionBuilder),
          ),
        ]),
      )
      .where('r.is_file', '=', 1)
      .where('r.is_readonly', '=', 0);
  }

  if (onlyWritable) {
    query = query.where('r.is_readonly', '=', 0);
  }

  return query;
}

type TreeNodeQueryType = DB & {
  r: Resource;
};

function getTreeNodeProps(eb: ExpressionBuilder<TreeNodeQueryType, 'r'>) {
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
type ExpansionNode = {
  id: number;
  can_have_children: number;
  inherited_match: SqlBool;
  path: string;
};

async function getStartingNode(
  trx: Transaction<DB>,
  fromNodePath: string,
  filters: ResourceTreeFilters,
): Promise<ExpansionNode | undefined> {
  return trx
    .selectFrom('resource as r')
    .select(['r.id', 'r.path', 'r.can_have_children'])
    .select((eb) =>
      eb
        .exists((eb) =>
          eb
            .selectFrom('resource as ancestor')
            .selectAll()
            .whereRef('ancestor.id', '<=', 'r.id')
            .whereRef('ancestor.max_descendant_id', '>=', 'r.id')
            .where('ancestor.path', '!=', '')
            .where((eb) =>
              getMatchesFiltersExpression({
                id: eb.ref('ancestor.id'),
                path: eb.ref('ancestor.path'),
                name: eb.ref('ancestor.name'),
                filters,
              }),
            ),
        )
        .as('inherited_match'),
    )
    .where('r.path', '=', removeTrailingSlash(fromNodePath))
    .executeTakeFirst();
}

async function getVisibleChildren(
  trx: Transaction<DB>,
  parent: ExpansionNode,
  filters: ResourceTreeFilters,
) {
  const inheritedMatch = Boolean(parent.inherited_match);
  const childrenQuery = trx
    .selectFrom('resource as child')
    .select(['child.id', 'child.path', 'child.can_have_children'])
    .where('child.parent_id', '=', parent.id)
    .where((eb) =>
      getVisibleWithFiltersExpression({
        id: eb.ref('child.id'),
        maxDescendantId: eb.ref('child.max_descendant_id'),
        isReadonly: eb.ref('child.is_readonly'),
        inheritedMatch: eb.val<0 | 1>(inheritedMatch ? 1 : 0),
        filters,
      }),
    )
    .orderBy('child.id')
    .limit(2);

  return childrenQuery
    .select((eb) =>
      (inheritedMatch
        ? eb.val<0 | 1>(1)
        : getMatchesFiltersExpression({
            id: eb.ref('child.id'),
            path: eb.ref('child.path'),
            name: eb.ref('child.name'),
            filters,
          })
      ).as('inherited_match'),
    )
    .execute();
}

async function getFilteredNodePathsToExpand(
  trx: Transaction<DB>,
  fromNodePath: string,
  filters: ResourceTreeFilters,
): Promise<{ result: Array<string> }> {
  let node = await getStartingNode(trx, fromNodePath, filters);
  if (!node) {
    return { result: [] };
  }

  const paths = [node.path + (node.can_have_children ? '/' : '')];

  while (node.can_have_children) {
    const children = await getVisibleChildren(trx, node, filters);
    if (children.length !== 1 || !children[0].can_have_children) {
      break;
    }

    const child = children[0];
    paths.push(`${child.path}/`);
    node = child;
  }

  return { result: paths };
}

export async function getNodePathsToExpand({
  fromNodePath,
  ...filters
}: { fromNodePath: string } & ResourceTreeFilters): Promise<{
  result: Array<string>;
}> {
  if (hasActiveFilters(filters)) {
    return withFilteredResourcesTable(filters, (trx) =>
      getFilteredNodePathsToExpand(trx, fromNodePath, filters),
    );
  }

  const nodesToExpand = await getDb()
    .withRecursive('nodes', (eb) =>
      eb
        .selectFrom('resource')
        .select(['id', GET_LEGACY_RESOURCE_PATH])
        .where('path', '=', removeTrailingSlash(fromNodePath))
        .unionAll(
          eb
            .selectFrom('resource')
            .innerJoin('nodes', 'resource.parent_id', 'nodes.id')
            .select(['resource.id', GET_LEGACY_RESOURCE_PATH])
            .where('resource.can_have_children', '=', 1)
            .where(
              sql<number>`(select count(*) from resource where parent_id = nodes.id)`,
              '=',
              1,
            ),
        ),
    )
    .selectFrom('nodes')
    .select('path')
    .execute();

  return { result: nodesToExpand.map((node) => node.path) };
}
