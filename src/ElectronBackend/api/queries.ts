// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';
import { omit } from 'lodash';

import { Filter, FilterCounts, FILTERS } from '../../Frontend/shared-constants';
import {
  ClassificationStatistics,
  ProgressBarData,
} from '../../Frontend/types/types';
import { ClassificationsConfig } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { getFilterExpression, getSearchExpression } from './filters';
import { getResourceTree } from './resourceTree';
import {
  addFilterCounts,
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  removeTrailingSlash,
} from './utils';

export type CountsWithTotal = FilterCounts & { total: number };
export type ResourceRelationship =
  | 'same'
  | 'ancestor'
  | 'descendant'
  | 'unrelated';
type AttributionCounts = Partial<
  Record<ResourceRelationship, CountsWithTotal>
> &
  Record<'all' | 'sameOrDescendant', CountsWithTotal>;

type QueryFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param?: any,
) => Promise<{ result: NonNullable<unknown> | null }>; // Tanstack doesn't allow functions to return undefined

export const queries = {
  async getAttributionData(props: { attributionUuid: string }) {
    const result = await getDb()
      .selectFrom('attribution')
      .select('data')
      .where('uuid', '=', props.attributionUuid)
      .executeTakeFirst();

    return { result: result?.data ?? null };
  },

  async filterCounts(props: {
    external: boolean;
    filters: Array<Filter>;
    resourcePathForRelationships: string;
    license?: string;
    search?: string;
    showResolved?: boolean;
  }): Promise<{
    result: AttributionCounts;
  }> {
    const db = getDb();
    const resource = await getResourceOrThrow(
      db,
      props.resourcePathForRelationships,
    );

    const closestAncestor =
      await getClosestAncestorWithManualAttributionsBelowBreakpoint(
        db,
        resource.id,
      );

    let query = db
      .selectFrom('attribution')
      .select(
        attributionToResourceRelationship({
          resource,
          ancestorId: closestAncestor,
        }),
      )
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .select((eb) =>
        FILTERS.map((f) =>
          eb.fn
            .sum<number>(
              eb.case().when(getFilterExpression(eb, f)).then(1).else(0).end(),
            )
            .as(f),
        ),
      )
      .groupBy('relationship');

    query = query.where('is_external', '=', Number(props.external));

    for (const filter of props.filters) {
      query = query.where((eb) => getFilterExpression(eb, filter));
    }

    if (props.license) {
      query = query.where(sql<string>`trim(license_name)`, '=', props.license);
    }

    if (props.search) {
      const search = props.search;
      query = query.where((eb) => getSearchExpression(eb, search));
    }

    if (!props.showResolved) {
      query = query.where('is_resolved', '=', 0);
    }

    const sums = await query.execute();

    const sumsPerRelationship = Object.fromEntries(
      sums.map((s) => [s.relationship, omit(s, 'relationship')]),
    ) as Omit<AttributionCounts, 'all' | 'sameOrDescendant'>;

    const all = addFilterCounts(Object.values(sumsPerRelationship));
    const sameOrDescendant = addFilterCounts([
      sumsPerRelationship.same,
      sumsPerRelationship.descendant,
    ]);

    const byRelationship = { ...sumsPerRelationship, all, sameOrDescendant };

    return { result: byRelationship };
  },

  async getNodePathsToExpand({ fromNodePath }: { fromNodePath: string }) {
    const nodesToExpand = await getDb()
      .withRecursive('nodes', (eb) =>
        eb
          .selectFrom('resource')
          .select([
            'id',
            sql<string>`path || IF(can_have_children, '/', '')`.as('path'),
          ])
          .where('path', '=', removeTrailingSlash(fromNodePath))
          .unionAll(
            eb
              .selectFrom('resource')
              .innerJoin('nodes', 'resource.parent_id', 'nodes.id')
              .select([
                'resource.id',
                sql<string>`resource.path || IF(can_have_children, '/', '')`.as(
                  'path',
                ),
              ])
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

    return { result: nodesToExpand.map((n) => n.path) };
  },

  /**
   * If prioritizeResourcePath is given, it will always be included in the list
   * except if its level is deeper than `limit`.
   */
  async getResourcePathsAndParentsForAttributions({
    attributionUuids,
    limit,
    prioritizedResourcePath,
  }: {
    attributionUuids: Array<string>;
    limit?: number;
    prioritizedResourcePath?: string;
  }) {
    const prioritizedResource = prioritizedResourcePath
      ? await getResourceOrThrow(getDb(), prioritizedResourcePath)
      : undefined;

    let query = getDb()
      .selectFrom('resource')
      .select(sql<string>`path || IF(can_have_children, '/', '')`.as('path'))
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('resource_to_attribution as rta')
            .selectAll()
            .where((eb) =>
              eb.between(
                'rta.resource_id',
                eb.ref('resource.id'),
                eb.ref('resource.max_descendant_id'),
              ),
            )
            .where('attribution_uuid', 'in', attributionUuids),
        ),
      );

    if (prioritizedResource) {
      // Order prioritized resource and parents first
      query = query.orderBy(
        (eb) =>
          eb.between(
            eb.val(prioritizedResource.id),
            eb.ref('resource.id'),
            eb.ref('resource.max_descendant_id'),
          ),
        'desc',
      );
    }

    if (limit) {
      query = query.limit(limit);
    }

    const result = await query.execute();

    return { result: result.map((r) => r.path) };
  },

  async isResourceLinkedOnAllAttributions({
    resourcePath,
    attributionUuids,
  }: {
    resourcePath: string;
    attributionUuids: Array<string>;
  }) {
    const resource = await getResourceOrThrow(getDb(), resourcePath);

    const linkedAttributionCount = await getDb()
      .selectFrom('resource_to_attribution')
      .select((eb) =>
        eb.fn
          .count<number>('attribution_uuid')
          .distinct()
          .as('linked_attribution_count'),
      )
      .where('attribution_uuid', 'in', attributionUuids)
      .where('resource_id', '=', resource.id)
      .executeTakeFirstOrThrow();

    return {
      result:
        linkedAttributionCount.linked_attribution_count ===
        attributionUuids.length,
    };
  },

  getResourceTree,
  async getProgressBarData(props: { classifications: ClassificationsConfig }) {
    const result = await getDb()
      .transaction()
      .execute((trx) =>
        sql<{
          file_count: number;
          only_preselected: number;
          only_manual: number;
          only_external: number;
          medium_critical: number;
          highly_critical: number;
          criticality_paths: string | null;
          classification_paths: string | null;
        }>`
        WITH RECURSIVE
        -- Pre-compute flags for each resource
        resource_flags AS (
            SELECT 
                resource_id,
                NOT MIN(attribution.is_external) AND MIN(attribution.is_external OR attribution.pre_selected) as has_only_preselected,
                NOT MIN(attribution.is_external) as has_manual,
                MAX(attribution.is_external) as has_external,
                MAX(attribution.criticality) as highest_criticality,
                MAX(attribution.classification) as highest_classification
            FROM resource_to_attribution
            JOIN attribution ON resource_to_attribution.attribution_uuid = attribution.uuid
            WHERE attribution.is_resolved=0
            GROUP BY resource_id
        ),
        resource_tree(id, is_file, has_only_preselected, has_manual, has_external, has_non_inherited_external, highest_criticality, highest_classification) AS (
            SELECT 
                r.id,
                r.is_file,
                COALESCE(rf.has_only_preselected, 0), 
                COALESCE(rf.has_manual, 0), 
                COALESCE(rf.has_external, 0), 
                COALESCE(rf.has_external, 0), 
                COALESCE(rf.highest_criticality, 0),
                rf.highest_classification
            FROM resource r
            LEFT JOIN resource_flags rf ON r.id = rf.resource_id
            WHERE r.path = ''
            UNION ALL
            SELECT 
                child.id,
                child.is_file,
                COALESCE(rf.has_only_preselected, 0) OR ((parent.has_only_preselected=1 AND child.is_attribution_breakpoint=0) AND NOT COALESCE(rf.has_manual, 0)),
                (parent.has_manual=1 AND child.is_attribution_breakpoint=0) OR COALESCE(rf.has_manual, 0),
                (parent.has_external=1 AND child.is_attribution_breakpoint=0) OR COALESCE(rf.has_external, 0),
                COALESCE(rf.has_external, 0),
                COALESCE(rf.highest_criticality, 0),
                COALESCE(rf.highest_classification, parent.highest_classification)
            FROM resource_tree as parent
            JOIN resource AS child ON child.parent_id = parent.id
            LEFT JOIN resource_flags rf ON child.id = rf.resource_id
        ),
        criticality_paths(hc, paths) AS (
        SELECT highest_criticality, json_group_array(resource.path ORDER BY resource.path)
        FROM resource_tree
        JOIN resource ON resource.id = resource_tree.id
        WHERE has_non_inherited_external=1 AND has_only_preselected=0 AND has_manual=0 
        GROUP BY highest_criticality
        ),
        classification_paths(hc, paths) AS (
        SELECT highest_classification, json_group_array(resource.path ORDER BY resource.path)
        FROM resource_tree
        JOIN resource ON resource.id = resource_tree.id
        WHERE resource_tree.is_file=1 AND has_external=1 AND has_only_preselected=0 AND has_manual=0 
        GROUP BY highest_classification
        )
        SELECT 
            COUNT(*) as file_count,
            SUM(has_only_preselected) as only_preselected,
            SUM(has_manual AND NOT has_only_preselected) as only_manual,
            SUM(has_external AND NOT has_only_preselected AND NOT has_manual) as only_external,
            SUM(has_external AND NOT has_only_preselected AND NOT has_manual AND highest_criticality is 1) as medium_critical,
            SUM(has_external AND NOT has_only_preselected AND NOT has_manual AND highest_criticality is 2) as highly_critical,
            (SELECT json_group_object(criticality_paths.hc, criticality_paths.paths) FROM criticality_paths) as criticality_paths,
            (SELECT json_group_object(classification_paths.hc, classification_paths.paths) FROM classification_paths) as classification_paths
        FROM resource_tree
        WHERE is_file=1
      `.execute(trx),
      );

    const criticalityStatistics = result.rows[0].criticality_paths
      ? (JSON.parse(result.rows[0].criticality_paths) as Record<number, string>)
      : undefined;
    const resourcesWithMediumCriticalExternalAttributions =
      criticalityStatistics ? JSON.parse(criticalityStatistics[1] ?? '[]') : [];
    const resourcesWithHighlyCriticalExternalAttributions =
      criticalityStatistics ? JSON.parse(criticalityStatistics[2] ?? '[]') : [];
    const resourcesWithNonInheritedExternalAttributionOnly = [
      ...resourcesWithHighlyCriticalExternalAttributions,
      ...resourcesWithMediumCriticalExternalAttributions,
      ...(criticalityStatistics
        ? JSON.parse(criticalityStatistics[0] ?? '[]')
        : []),
    ];

    const parsedClassifications = result.rows[0].classification_paths
      ? (JSON.parse(result.rows[0].classification_paths) as Record<
          number,
          string
        >)
      : undefined;
    const classificationStatistics: ClassificationStatistics = {};
    Object.entries(props.classifications).forEach(
      ([classificationId, classificationEntry]) => {
        classificationStatistics[Number(classificationId)] = {
          description: classificationEntry.description,
          correspondingFiles: parsedClassifications
            ? JSON.parse(
                parsedClassifications[Number(classificationId)] ?? '[]',
              )
            : [],
          color: classificationEntry.color,
        };
      },
    );

    return {
      result: {
        fileCount: result.rows[0].file_count,
        filesWithManualAttributionCount: result.rows[0].only_manual,
        filesWithOnlyPreSelectedAttributionCount:
          result.rows[0].only_preselected,
        filesWithOnlyExternalAttributionCount: result.rows[0].only_external,
        filesWithHighlyCriticalExternalAttributionsCount:
          result.rows[0].highly_critical,
        filesWithMediumCriticalExternalAttributionsCount:
          result.rows[0].medium_critical,
        resourcesWithNonInheritedExternalAttributionOnly,
        resourcesWithHighlyCriticalExternalAttributions,
        resourcesWithMediumCriticalExternalAttributions,
        classificationStatistics,
      } as ProgressBarData,
    };
  },
} satisfies Record<string, QueryFunction>;

export type Queries = typeof queries;
export type QueryName = keyof Queries;

// Queries have either one parameter P (QueryParams = P) or none (QueryParams = void)
export type QueryParams<C extends QueryName> =
  Parameters<Queries[C]> extends [infer P] ? P : void;
export type QueryReturn<C extends QueryName> = ReturnType<Queries[C]>;
export type QueryResult<C extends QueryName> = Awaited<
  QueryReturn<C>
>['result'];
