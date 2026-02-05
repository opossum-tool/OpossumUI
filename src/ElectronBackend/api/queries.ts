// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from '../db/db';

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

  async getAttributionData(props: { attributionUuid: string }) {
    const result = await getDb()
      .selectFrom('attribution')
      .select('data')
      .where('uuid', '=', props.attributionUuid)
      .executeTakeFirst();

    return { result: result?.data ?? null };
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
