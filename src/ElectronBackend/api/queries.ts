// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';
import { omit } from 'lodash';

import { Filter, FilterCounts, FILTERS } from '../../Frontend/shared-constants';
import { FileWithAttributionsCounts } from '../../Frontend/types/types';
import { PackageInfo } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { getFilterExpression, getSearchExpression } from './filters';
import { listAttributions } from './listAttributions';
import { getResourceTree } from './resourceTree';
import {
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  mergeFilterProperties,
  removeTrailingSlash,
  type ResourceRelationship,
  resourcesToExpand,
  toSnakeCase,
} from './utils';

type AutocompletableAttribute =
  | 'packageType'
  | 'packageNamespace'
  | 'packageName'
  | 'packageVersion'
  | 'url'
  | 'licenseName';

type AutocompleteOptions = Record<
  'manual' | 'external',
  Array<{ contained_uuid: string; value: string; count: number }>
>;

export type FilterProperties = FilterCounts & {
  total: number;
  licenses: Array<string>;
};
type AttributionCounts = Partial<
  Record<ResourceRelationship, FilterProperties>
> &
  Record<'all' | 'sameOrDescendant', FilterProperties>;

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
      .executeTakeFirstOrThrow();

    return { result: JSON.parse(result.data) as PackageInfo };
  },

  async getManualAttributionOnResourceOrAncestor(props: {
    resourcePath: string;
  }) {
    const resource = await getResourceOrThrow(getDb(), props.resourcePath);

    const manualAttributionOnResource = await getDb()
      .selectFrom('attribution')
      .innerJoin(
        'resource_to_attribution',
        'attribution.uuid',
        'resource_to_attribution.attribution_uuid',
      )
      .select('data')
      .where('resource_id', '=', resource.id)
      .where('attribution_is_external', '=', 0)
      .limit(1)
      .executeTakeFirst();

    if (manualAttributionOnResource) {
      return {
        result: JSON.parse(manualAttributionOnResource.data) as PackageInfo,
      };
    }

    const ancestor =
      await getClosestAncestorWithManualAttributionsBelowBreakpoint(
        getDb(),
        resource.id,
      );

    if (ancestor) {
      const manualAttributionOnAncestor = await getDb()
        .selectFrom('attribution')
        .innerJoin(
          'resource_to_attribution',
          'attribution.uuid',
          'resource_to_attribution.attribution_uuid',
        )
        .select('data')
        .where('resource_id', '=', ancestor)
        .where('attribution_is_external', '=', 0)
        .limit(1)
        .executeTakeFirstOrThrow();

      return {
        result: JSON.parse(manualAttributionOnAncestor.data) as PackageInfo,
      };
    }

    return { result: null };
  },

  async autoCompleteOptions({
    attributeName,
    onlyRelatedToResourcePath,
  }: {
    attributeName: AutocompletableAttribute;
    onlyRelatedToResourcePath: string;
  }): Promise<{
    result: AutocompleteOptions;
  }> {
    const onlyRelatedToResource = await getResourceOrThrow(
      getDb(),
      onlyRelatedToResourcePath,
    );

    const closestAncestorToResource =
      await getClosestAncestorWithManualAttributionsBelowBreakpoint(
        getDb(),
        onlyRelatedToResource.id,
      );

    let query = getDb()
      .selectFrom('attribution')
      .select((eb) => [
        'uuid as contained_uuid',
        eb.ref(toSnakeCase(attributeName)).$notNull().as('value'),
        'is_external',
        eb.fn.countAll<number>().as('count'),
      ])
      .where('is_resolved', '=', 0)
      .where(toSnakeCase(attributeName), 'is not', null)
      .where(toSnakeCase(attributeName), '!=', '')
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('resource_to_attribution')
            .selectAll()
            .whereRef('attribution_uuid', '=', 'attribution.uuid')
            .where((eb) =>
              eb.or([
                eb.between(
                  'resource_id',
                  onlyRelatedToResource.id,
                  onlyRelatedToResource.max_descendant_id,
                ),
                ...(closestAncestorToResource
                  ? [eb('resource_id', '=', closestAncestorToResource)]
                  : []),
              ]),
            ),
        ),
      );

    query = query.groupBy(['value', 'is_external']);

    const result = await query.execute();

    return {
      result: {
        external: result.filter((r) => r.is_external === 1),
        manual: result.filter((r) => r.is_external === 0),
      },
    };
  },

  listAttributions,

  async filterProperties(props: {
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
        }).as('relationship'),
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
      .select(
        sql<string>`json_group_array(DISTINCT trim(license_name))`.as(
          'licenses',
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
      sums.map((s) => [
        s.relationship,
        {
          ...omit(s, 'relationship', 'licenses'),
          licenses: JSON.parse(s.licenses).filter(Boolean).toSorted() ?? [],
        },
      ]),
    ) as Omit<AttributionCounts, 'all' | 'sameOrDescendant'>;

    const all = mergeFilterProperties(Object.values(sumsPerRelationship));
    const sameOrDescendant = mergeFilterProperties([
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
    const results: Array<string> = [];

    if (prioritizedResourcePath) {
      const prioritizedResource = await getResourceOrThrow(
        getDb(),
        prioritizedResourcePath,
      );

      results.push(
        ...(await resourcesToExpand(getDb(), {
          aboveAttributionUuids: attributionUuids,
          aboveResourceId: prioritizedResource.id,
          limit,
        })),
      );
    }

    results.push(
      ...(await resourcesToExpand(getDb(), {
        aboveAttributionUuids: attributionUuids,
        limit,
      })),
    );

    const deduplicatedLimitedResults = new Set<string>();

    for (const r of results) {
      deduplicatedLimitedResults.add(r);
      if (limit && deduplicatedLimitedResults.size === limit) {
        break;
      }
    }

    return { result: Array.from(deduplicatedLimitedResults) };
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

  async getAttributionProgressBarData(): Promise<{
    result: FileWithAttributionsCounts;
  }> {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const { file_count } = await trx
          .selectFrom('resource')
          .select((eb) => eb.fn.countAll<number>().as('file_count'))
          .where('is_file', '=', 1)
          .executeTakeFirstOrThrow();

        const { manual_non_pre_selected_count } = await trx
          .selectFrom('cwa')
          .select((eb) =>
            eb.fn.countAll<number>().as('manual_non_pre_selected_count'),
          )
          .where('is_file', '=', 1)
          .where('manual', 'is not', null)
          .where('manual', 'in', (eb) =>
            eb
              .selectFrom('resource_to_attribution')
              .select('resource_id')
              .where('attribution_uuid', 'in', (eb) =>
                eb
                  .selectFrom('attribution')
                  .select('uuid')
                  .where('pre_selected', '=', 0)
                  .where('is_external', '=', 0),
              ),
          )
          .executeTakeFirstOrThrow();

        const { manual_count } = await trx
          .selectFrom('cwa')
          .select((eb) => eb.fn.countAll<number>().as('manual_count'))
          .where('is_file', '=', 1)
          .where('manual', 'is not', null)
          .executeTakeFirstOrThrow();

        const { only_external_count } = await trx
          .selectFrom('cwa')
          .select((eb) => eb.fn.countAll<number>().as('only_external_count'))
          .where('is_file', '=', 1)
          .where('manual', 'is', null)
          .where('external', 'is not', null)
          .executeTakeFirstOrThrow();

        return {
          fileCount: file_count,
          manualNonPreSelectedFileCount: manual_non_pre_selected_count,
          manualPreSelectedFileCount:
            manual_count - manual_non_pre_selected_count,
          onlyExternalFileCount: only_external_count,
        };
      });
    return { result };
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
