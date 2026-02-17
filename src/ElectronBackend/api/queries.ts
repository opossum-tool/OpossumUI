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
import {
  addFilterCounts,
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
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
  /**
   * Returns the paths of resources that contain the given search string (case insensitive)
   *
   * For backwards compatibility, an / is appended to the path
   * if the resource can have children (i.e. is a directory or is included in files_with_children)
   */
  async searchResources(props: { searchString: string }) {
    const result = await getDb()
      .selectFrom('resource')
      .select([sql<string>`path || IF(can_have_children, '/', '')`.as('path')])
      .where(sql<boolean>`instr(LOWER(path), LOWER(${props.searchString})) > 0`)
      .execute();
    return { result: result.map((r) => r.path) };
  },

  async resourceDescendantCount(props: {
    searchString: string;
    resourcePath: string;
    onAttributions?: Array<string>;
  }) {
    const db = getDb();
    const resource = await getResourceOrThrow(db, props.resourcePath);
    let query = getDb()
      .selectFrom('resource')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .where('id', '>=', resource.id)
      .where('id', '<=', resource.max_descendant_id)
      .where('path', 'like', `%${props.searchString}%`);
    if (props.onAttributions !== undefined) {
      const onAttributions = props.onAttributions;
      query = query.where((eb) =>
        eb(
          'id',
          'in',
          eb
            .selectFrom('resource_to_attribution')
            .select('resource_id')
            .where('attribution_uuid', 'in', onAttributions),
        ),
      );
    }
    const result = await query.executeTakeFirstOrThrow();

    return { result: result.total };
  },

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
    const byRelationship = await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(
          trx,
          props.resourcePathForRelationships,
        );

        const closestAncestor =
          await getClosestAncestorWithManualAttributionsBelowBreakpoint(
            trx,
            resource.id,
          );

        let query = trx
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
                  eb
                    .case()
                    .when(getFilterExpression(eb, f))
                    .then(1)
                    .else(0)
                    .end(),
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
          query = query.where(
            sql<string>`trim(license_name)`,
            '=',
            props.license,
          );
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

        return { ...sumsPerRelationship, all, sameOrDescendant };
      });

    return { result: byRelationship };
  },

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
                MAX(NOT attribution.is_external) AND MIN(attribution.is_external OR attribution.pre_selected) as has_only_preselected,
                MAX(NOT attribution.is_external) as has_manual,
                MAX(attribution.is_external) as has_external,
                MAX(attribution.criticality) as highest_criticality,
                MAX(attribution.classification) as highest_classification
            FROM resource_to_attribution
            JOIN attribution ON resource_to_attribution.attribution_uuid = attribution.uuid
            WHERE NOT attribution.is_resolved
            GROUP BY resource_id
        ),
        resource_tree(id, has_only_preselected, has_manual, has_external, has_non_inherited_external, highest_criticality, highest_classification) AS (
            SELECT 
                r.id, 
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
                ((parent.has_only_preselected AND NOT child.is_attribution_breakpoint) AND NOT COALESCE(rf.has_manual, 0)) OR COALESCE(rf.has_only_preselected, 0),
                (parent.has_manual AND NOT child.is_attribution_breakpoint) OR COALESCE(rf.has_manual, 0),
                (parent.has_external AND NOT child.is_attribution_breakpoint) OR COALESCE(rf.has_external, 0),
                COALESCE(rf.has_external, 0),
                COALESCE(rf.highest_criticality, 0),
                COALESCE(rf.highest_classification, parent.highest_classification)
            FROM resource_tree as parent
            JOIN resource AS child ON child.parent_id = parent.id
            LEFT JOIN resource_flags rf ON child.id = rf.resource_id
        ),
        criticality_paths(hc, paths) AS (
        SELECT highest_criticality, json_group_array(resource.path)
        FROM resource_tree
        JOIN resource ON resource.id=resource_tree.id 
        WHERE has_non_inherited_external AND NOT has_only_preselected AND NOT has_manual 
        GROUP BY highest_criticality
        ),
        classification_paths(hc, paths) AS (
        SELECT highest_classification, json_group_array(resource.path)
        FROM resource_tree
        JOIN resource ON resource.id=resource_tree.id 
        WHERE resource.is_file AND has_external AND NOT has_only_preselected AND NOT has_manual 
        GROUP BY highest_classification
        )
        SELECT 
            SUM(resource.is_file) as file_count,
            SUM(resource.is_file AND has_only_preselected) as only_preselected,
            SUM(resource.is_file AND has_manual AND NOT has_only_preselected) as only_manual,
            SUM(resource.is_file AND has_external AND NOT has_only_preselected AND NOT has_manual) as only_external,
            SUM(resource.is_file AND has_external AND NOT has_only_preselected AND NOT has_manual AND highest_criticality is 1) as medium_critical,
            SUM(resource.is_file AND has_external AND NOT has_only_preselected AND NOT has_manual AND highest_criticality is 2) as highly_critical,
            (SELECT json_group_object(criticality_paths.hc, criticality_paths.paths) FROM criticality_paths) as criticality_paths,
            (SELECT json_group_object(classification_paths.hc, classification_paths.paths) FROM classification_paths) as classification_paths
        FROM resource_tree
        JOIN resource ON resource.id=resource_tree.id
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
