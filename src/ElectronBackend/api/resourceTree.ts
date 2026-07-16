// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Expression,
  expressionBuilder,
  type ExpressionBuilder,
  sql,
  type Transaction,
} from 'kysely';

import { getDb } from '../db/db';
import type { DB, Resource } from '../db/generated/databaseTypes';
import {
  getOnlyExternalFilesQuery,
  getOnlyPreSelectedManualFilesQuery,
} from './progressBarUtils';
import {
  getResourceOrThrow,
  removeTrailingSlash,
  toCanonicalLicenseName,
} from './utils';

export type ResourceTreeNodeData = Awaited<
  ReturnType<typeof getResourceTree>
>['result']['treeNodes'][number];

const FILTERED_RESOURCE_TEMP_TABLE = 'filtered_resources';
type FilteredTable = { filtered_resources: { id: number } };

export function getResourceTree({
  search,
  expandedNodes,
  onlyUnreviewedFiles,
  license,
  onAttributionUuids,
  selectedResourcePath,
}: {
  search?: string;
  expandedNodes: Array<string> | 'expandAll';
  onlyUnreviewedFiles?: boolean;
  license?: string;
  onAttributionUuids?: Array<string>;
  selectedResourcePath?: string;
}) {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const hasActiveFilters = Boolean(
        search || license || onAttributionUuids || onlyUnreviewedFiles,
      );
      /*
       * FILTERED_RESOURCE_TEMP_TABLE contains the resources included by the active filters.
       * Without active filters, it is a view on `resource` with no runtime overhead.
       */

      let dropTempTable;
      if (hasActiveFilters) {
        const filterQuery = getFilteredResourcesQuery(trx, {
          license,
          onlyUnreviewedFiles,
          onAttributionUuids,
          search,
        });

        await trx.schema
          .createTable(FILTERED_RESOURCE_TEMP_TABLE)
          .temporary()
          .as(filterQuery)
          .execute();

        await trx.schema
          .createIndex('temp.filtered_resources_id_idx')
          .on(FILTERED_RESOURCE_TEMP_TABLE)
          .column('id')
          .execute();

        dropTempTable = () =>
          trx.schema.dropTable(FILTERED_RESOURCE_TEMP_TABLE).execute();
      } else {
        await trx.schema
          .createView(FILTERED_RESOURCE_TEMP_TABLE)
          .temporary()
          .as(trx.selectFrom('resource').select('id'))
          .execute();

        dropTempTable = () =>
          trx.schema.dropView(FILTERED_RESOURCE_TEMP_TABLE).execute();
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

      const total = (
        await trx
          .withTables<FilteredTable>()
          .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
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
            .withTables<FilteredTable>()
            .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
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
        await dropTempTable();
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
              'parent_id',
              sb.val(0).as('level'),
              sb.val(0).as('has_parent_with_manual_attribution'),
            ])
            .select((eb) => getTreeNodeProps(eb))
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
                  'r.parent_id',
                  sql<number>`parent.level + 1`.as('level'),
                  sql<number>`r.is_attribution_breakpoint = 0 AND (parent.has_manual_attribution OR parent.has_parent_with_manual_attribution)`.as(
                    'has_parent_with_manual_attribution',
                  ),
                ])
                .select((eb) => getTreeNodeProps(eb));

              if (expandedNodes !== 'expandAll') {
                query = query.where(
                  'parent.path',
                  'in',
                  expandedNodes.map((e) => removeTrailingSlash(e)),
                );
              }

              if (hasActiveFilters) {
                query = query.where((eb) =>
                  filteredResourcesContainIdBetween(
                    eb.ref('r.id'),
                    eb.ref('r.max_descendant_id'),
                  ),
                );
              }

              return query;
            }),
        )
        .selectFrom('shown_resources')
        .selectAll()
        .select((eb) =>
          filteredResourcesContainIdBetween(
            sql<number>`shown_resources.id + 1`,
            eb.ref('shown_resources.max_descendant_id'),
          ).as('is_expandable'),
        );

      query = query.orderBy('id');

      const treeNodes = (await query.execute()).map((node) => ({
        id: node.path + (node.can_have_children ? '/' : ''), // For compatibility with legacy code
        labelText: node.name || '/',
        level: node.level,
        isExpandable: Boolean(node.is_expandable),
        isExpanded:
          expandedNodes === 'expandAll' ||
          expandedNodes.includes(
            node.path + (node.can_have_children ? '/' : ''),
          ),
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
        canHaveChildren: Boolean(node.can_have_children),
        isAttributionBreakpoint: Boolean(node.is_attribution_breakpoint),
        isFile: Boolean(node.is_file),
        criticality: node.max_criticality_on_unresolved_external_attribution,
        classification:
          node.max_classification_on_unresolved_external_attribution,
      }));

      await dropTempTable();

      return {
        result: {
          treeNodes,
          count: total,
          belowSelectedResource: belowSelectedResourceTotal,
        },
      };
    });
}

export async function getResourceTreeUnreviewedCount({
  license,
  onAttributionUuids,
  search,
}: {
  license?: string;
  onAttributionUuids?: Array<string>;
  search?: string;
}) {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const count = await trx
        .selectFrom(
          getFilteredResourcesQuery(trx, {
            license,
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
    license,
    onlyUnreviewedFiles,
    onAttributionUuids,
    search,
  }: {
    license?: string;
    onlyUnreviewedFiles?: boolean;
    onAttributionUuids?: Array<string>;
    search?: string;
  },
) {
  let query = trx.selectFrom('resource as r').select('r.id as id');

  if (search) {
    query = query.where('r.path', 'like', `%${search}%`);
  }

  if (license) {
    query = query.where('r.id', 'in', (eb) =>
      eb
        .selectFrom('attribution as a')
        .innerJoin(
          'resource_to_attribution as rta',
          'rta.attribution_uuid',
          'a.uuid',
        )
        .select('rta.resource_id')
        .where('a.is_external', '=', 0)
        .where(
          'a.canonical_license_name',
          '=',
          toCanonicalLicenseName(license),
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
      .where('r.is_file', '=', 1);
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
