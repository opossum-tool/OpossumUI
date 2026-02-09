// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {
  CommandName,
  CommandParams,
  CommandResult,
} from '../../ElectronBackend/api/commands';
import {
  MutationName,
  MutationParams,
  MutationResult,
} from '../../ElectronBackend/api/mutations';
import {
  QueryName,
  QueryParams,
  QueryResult,
} from '../../ElectronBackend/api/queries';
import { queryClient } from '../Components/AppContainer/queryClient';

// We use the same options as tanstack query, with the exception that the
// the consumer can't set mutationKey and mutationFn, which are set by us
type ClientMutationOptions<M extends MutationName> = Omit<
  UseMutationOptions<Awaited<MutationResult<M>>, unknown, MutationParams<M>>, // Result type, Error Type, Parameter Type
  'mutationKey' | 'mutationFn'
>;

type ClientMutationReturn<M extends MutationName> = ReturnType<
  typeof useMutation<Awaited<MutationResult<M>>, unknown, MutationParams<M>> // Result type, Error Type, Parameter Type
>;

// We use the same options as tanstack query, with the exception that the
// the consumer can't set queryKey and queryFn, which are set by us
type ClientQueryOptions<Q extends QueryName> = Omit<
  UseQueryOptions<Awaited<CommandResult<Q>>>,
  'queryKey' | 'queryFn'
>;

type ClientQueryParams<Q extends QueryName> =
  QueryParams<Q> extends void // So params is optional when the query function has no parameters
    ? [params?: undefined, options?: ClientQueryOptions<Q>]
    : [params: QueryParams<Q>, options?: ClientQueryOptions<Q>];

type ClientQueryReturn<Q extends QueryName> = ReturnType<
  typeof useQuery<Awaited<QueryResult<Q>>>
>;

type BackendClient = {
  [Q in QueryName]: {
    useQuery: (...args: ClientQueryParams<Q>) => ClientQueryReturn<Q>;
  };
} & {
  [M in MutationName]: {
    mutate: (params: MutationParams<M>) => Promise<MutationResult<M>>;
    useMutation: (
      options?: ClientMutationOptions<M>,
    ) => ClientMutationReturn<M>;
  };
};

/**
 * Access the backend api commands as queries and mutations.
 * Mutations automatically invalidate the appropriate queries.
 *
 * ## Usage
 *
 * ### For queries
 *
 * For a query with name `queryName`, call
 *
 * ```
 * // Query without parameters
 * const result = backend.queryName.useQuery();
 * const result = backend.queryName.useQuery(unknown, options); // With Tanstack Query Options
 *
 * // Query with parameters
 * const result = backend.queryName.useQuery(params);
 * const result = backend.queryName.useQuery(params, options);
 * ```
 *
 * Then you can access `result.data`, `result.isLoading`, etc.
 *
 * #### For mutations
 *
 * For a mutation with name `mutationName`, call
 *
 * ```
 * const mutation = backend.mutationName.useMutation();
 *
 * mutation.mutate(params);
 * ```
 */
export const backend = new Proxy({} as BackendClient, {
  get(_, command: CommandName) {
    const getQueryKey = (command: CommandName, params: unknown) =>
      ['backend', command, params] as const;

    async function mutate(params: MutationParams<MutationName>) {
      const response = await window.electronAPI.api(
        command,
        params as CommandParams<typeof command>,
      );

      // Invalidate queries affected by the mutation
      if ('invalidates' in response && response.invalidates) {
        const invalidates = response.invalidates;
        await Promise.all(
          invalidates.map((invalidation) => {
            const queryKey =
              'params' in invalidation
                ? getQueryKey(invalidation.queryName, invalidation.params)
                : ['backend', invalidation.queryName];
            return queryClient.resetQueries({
              queryKey,
            });
          }),
        );
      }
      return 'result' in response ? response.result : undefined;
    }

    return {
      // For commands specified in src/ElectronBackend/api/queries.ts
      useQuery: (params?: QueryParams<QueryName>, options?: object) =>
        useQuery({
          queryKey: getQueryKey(command, params),
          queryFn: async () => {
            const response = await window.electronAPI.api<QueryName>(
              command as QueryName,
              params as QueryParams<QueryName>,
            );
            return response.result;
          },
          ...options,
        }),
      // For commands specified in src/ElectronBackend/api/mutations.ts
      mutate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useMutation: (options?: ClientMutationOptions<any>) => {
        return useMutation({
          mutationKey: ['backend', command],
          mutationFn: mutate,
          ...options,
        });
      },
    };
  },
});
