// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';
import { omit } from 'lodash';

import { Filter, FilterCounts, FILTERS } from '../../Frontend/shared-constants';
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
          .union(
            eb
              .selectFrom('resource')
              .innerJoin('nodes', 'resource.parent_id', 'nodes.id')
              .select([
                'resource.id',
                sql<string>`resource.path || IF(can_have_children, '/', '')`.as(
                  'path',
                ),
              ])
              .where((eb) =>
                eb.and([
                  eb('resource.can_have_children', '=', 1),
                  eb(
                    sql<number>`(select count(*) from resource where parent_id = nodes.id)`,
                    '=',
                    1,
                  ),
                ]),
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
            .whereRef('resource.id', '<=', 'rta.resource_id')
            .whereRef('rta.resource_id', '<=', 'resource.max_descendant_id')
            .where('attribution_uuid', 'in', attributionUuids),
        ),
      );

    if (prioritizedResource) {
      // Order prioritized resource and parents first
      query = query.orderBy(
        (eb) =>
          eb.and([
            eb('resource.id', '<=', prioritizedResource.id),
            eb('resource.max_descendant_id', '>=', prioritizedResource.id),
          ]),
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
