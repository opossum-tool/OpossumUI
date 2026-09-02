// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type QueryClient,
  type QueryKey,
  skipToken,
  type SkipToken,
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import type {
  CommandName,
  CommandResult,
} from '../../ElectronBackend/api/commands';
import type {
  MutationName,
  MutationParams,
  MutationResult,
} from '../../ElectronBackend/api/mutations';
import type {
  QueryName,
  QueryParams,
  QueryResult,
} from '../../ElectronBackend/api/queries';
import { queryClient } from '../Components/AppContainer/queryClient';
import { invalidateMutationQueries } from './invalidate-mutation-queries';

// We use the same options as tanstack query, with the exception that the
// consumer can't set mutationKey and mutationFn, which are set by us
type ClientMutationOptions<M extends MutationName> = Omit<
  UseMutationOptions<MutationResult<M>, unknown, MutationParams<M>>, // Result type, Error Type, Parameter Type
  'mutationKey' | 'mutationFn'
> & {
  onBeforeInvalidation?: (result: MutationResult<M>) => void;
};

type ClientMutationReturn<M extends MutationName> = ReturnType<
  typeof useMutation<MutationResult<M>, unknown, MutationParams<M>> // Result type, Error Type, Parameter Type
>;

type GenericClientMutationOptions = Omit<
  UseMutationOptions<unknown, unknown, MutationParams<MutationName>>,
  'mutationKey' | 'mutationFn'
> & {
  onBeforeInvalidation?: (result: unknown) => void;
};

// We use the same options as tanstack query, with the exception that the
// consumer can't set queryKey and queryFn, which are set by us
type ClientQueryOptions<Q extends QueryName> = Omit<
  UseQueryOptions<Awaited<CommandResult<Q>>>,
  'queryKey' | 'queryFn'
>;

type ClientQueryParams<Q extends QueryName> =
  QueryParams<Q> extends void // So params is optional when the query function has no parameters
    ? [params?: undefined, options?: ClientQueryOptions<Q>]
    : [params: QueryParams<Q> | SkipToken, options?: ClientQueryOptions<Q>];

type ClientQueryReturn<Q extends QueryName> = ReturnType<
  typeof useQuery<Awaited<QueryResult<Q>>>
>;

type BackendClient = {
  [Q in QueryName]: {
    /**
     * Asynchronous one-time call to query data from the backend, for use outside of React components.
     * Not affected by invaldation.
     */
    query: (params: QueryParams<Q>) => Promise<QueryResult<Q>>;
    /**
     * Tanstack Query hook for querying the backend.
     * Automatically handles caching and invalidation.
     */
    useQuery: (...args: ClientQueryParams<Q>) => ClientQueryReturn<Q>;
  };
} & {
  [M in MutationName]: {
    /**
     * Asynchronous call to mutate data in the backend, for use outside of React components.
     * Automatically invalidates affected queries.
     */
    mutate: (params: MutationParams<M>) => Promise<MutationResult<M>>;

    /**
     * Tanstack Query hook to mutate data in the backend, for use in React components.
     * Automatically invalidates affected queries after onBeforeInvalidation has run.
     */
    useMutation: (
      options?: ClientMutationOptions<M>,
    ) => ClientMutationReturn<M>;
  };
};

/**
 * A boolean flag that prevents queries from being executed before the database is initialized.
 * This also invalidates all queries when flipped, otherwise old data could be shown.
 */
let databaseInitialized = false;
const databaseInitializedSubscribers = new Set<() => void>();
export function setDatabaseInitialized(initialized: boolean) {
  databaseInitialized = initialized;
  databaseInitializedSubscribers.forEach((cb) => {
    cb();
  });
  queryClient.clear();
  void queryClient.resetQueries();
}
export function useDatabaseInitialized(): boolean {
  return useSyncExternalStore(
    (cb) => {
      databaseInitializedSubscribers.add(cb);
      return () => databaseInitializedSubscribers.delete(cb);
    },
    () => databaseInitialized,
  );
}

function queryKeyForCommand(command: CommandName, params: unknown): QueryKey {
  return ['backend', command, params];
}

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
 * mutation.mutate(params);
 * ```
 */
export const backend = new Proxy({} as BackendClient, {
  get(_, command: CommandName) {
    async function mutate(
      params: MutationParams<MutationName>,
      onSuccessBeforeInvalidation?: (result: unknown) => void,
      mutationQueryClient: QueryClient = queryClient,
    ) {
      const response = await window.electronAPI.api(command, params);
      const mutationResult = 'result' in response ? response.result : undefined;
      onSuccessBeforeInvalidation?.(mutationResult);
      await invalidateMutationQueries({
        queryClient: mutationQueryClient,
        invalidations:
          'invalidates' in response ? (response.invalidates ?? []) : [],
      });
      window.electronAPI.saveFile();
      return mutationResult;
    }

    async function query(params?: QueryParams<QueryName>) {
      const response = await window.electronAPI.api<QueryName>(
        command as QueryName,
        params,
      );
      return response.result;
    }

    return {
      // For commands specified in src/ElectronBackend/api/queries.ts
      query,
      useQuery: (
        params?: QueryParams<QueryName> | SkipToken,
        options?: ClientQueryOptions<QueryName>,
      ) => {
        const initialized = useDatabaseInitialized();

        return useQuery({
          queryKey: queryKeyForCommand(command, params),
          queryFn:
            initialized && params !== skipToken
              ? () => {
                  return query(params);
                }
              : skipToken,
          ...options,
        });
      },

      // For commands specified in src/ElectronBackend/api/mutations.ts
      mutate,
      useMutation: (options?: GenericClientMutationOptions) => {
        const mutationQueryClient = useQueryClient();
        const { onBeforeInvalidation, ...mutationOptions } = options ?? {};
        return useMutation<unknown, unknown, MutationParams<MutationName>>({
          mutationKey: ['backend', command],
          mutationFn: (params) =>
            mutate(params, onBeforeInvalidation, mutationQueryClient),
          ...mutationOptions,
        });
      },
    };
  },
});

export async function invalidateBackendQueries() {
  await queryClient.invalidateQueries({ queryKey: ['backend'] });
  return undefined;
}
