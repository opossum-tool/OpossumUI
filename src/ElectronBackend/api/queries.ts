// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';
import { omit } from 'lodash';

import { Filter, FilterCounts, FILTERS } from '../../Frontend/shared-constants';
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
