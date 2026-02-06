// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getDb } from '../db/db';
import { QueryName, QueryParams } from './queries';

type QueryInvalidation<Q extends QueryName> = {
  queryName: Q;
  params?: QueryParams<Q>;
};

// Immediately Indexed Mapped Type: Ensures that queryName and params match
type QueryInvalidationUnion = {
  [Q in QueryName]: QueryInvalidation<Q>;
}[QueryName];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFunction = (param?: any) => Promise<{
  result?: unknown;
  invalidates?: Array<QueryInvalidationUnion>;
}>;

export const mutations = {
  async deleteAttribution(props: { attributionUuid: string }) {
    await getDb()
      .deleteFrom('attribution')
      .where('uuid', '=', props.attributionUuid)
      .execute();

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: props.attributionUuid },
        },
      ],
    };
  },

  async deleteAllAttributions() {
    await getDb().deleteFrom('attribution').execute();

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
        },
      ],
    };
  },
} satisfies Record<string, MutationFunction>;

export type Mutations = typeof mutations;
export type MutationName = keyof Mutations;

export type MutationParams<C extends MutationName> =
  Parameters<Mutations[C]> extends [infer P] ? P : void;
export type MutationReturn<C extends MutationName> = ReturnType<Mutations[C]>;
export type MutationResult<C extends MutationName> =
  Awaited<MutationReturn<C>> extends { result: unknown }
    ? Awaited<MutationReturn<C>>['result']
    : void;
