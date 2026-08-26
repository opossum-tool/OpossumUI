// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type QueryKey,
  skipToken,
  type SkipToken,
  useMutation,
  type UseMutationOptions,
  useQuery,
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
import { traceFrontendPhase } from './frontend-performance-tracing';
import { enqueueAttributionPageReconciliation } from './reconcile-attribution-lists';

export const ATTRIBUTION_NAVIGATION_QUERY_KEY = [
  'backend',
  'locateAttribution',
] as const satisfies QueryKey;

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

function queryKeyHash(queryKey: QueryKey): string {
  return JSON.stringify(queryKey);
}

function queryParamsContainAffectedAttribution(
  queryName: QueryName,
  params: unknown,
  affectedAttributionUuids: ReadonlySet<string>,
): boolean {
  if (params === undefined || params === null) {
    return false;
  }

  if (typeof params !== 'object') {
    return false;
  }

  const queryParams = params as {
    attributionUuid?: unknown;
    attributionUuids?: unknown;
  };
  if (
    queryName === 'getAttributionData' &&
    typeof queryParams.attributionUuid === 'string'
  ) {
    return affectedAttributionUuids.has(queryParams.attributionUuid);
  }

  if (
    (queryName === 'getAttributions' ||
      queryName === 'getResourceInfoOnAttributions' ||
      queryName === 'resourceAndAttributionAreLinked') &&
    Array.isArray(queryParams.attributionUuids)
  ) {
    return queryParams.attributionUuids.some(
      (uuid): uuid is string =>
        typeof uuid === 'string' && affectedAttributionUuids.has(uuid),
    );
  }

  if (
    queryName === 'resourceAndAttributionAreLinked' &&
    typeof queryParams.attributionUuid === 'string'
  ) {
    return affectedAttributionUuids.has(queryParams.attributionUuid);
  }

  return false;
}

function getCachedQueryKeys(invalidation: {
  queryName: QueryName;
  params?: unknown;
}): Array<QueryKey> {
  if (invalidation.params !== undefined) {
    const queryKey = queryKeyForCommand(
      invalidation.queryName,
      invalidation.params,
    );
    return queryClient.getQueryCache().find({ queryKey, exact: true })
      ? [queryKey]
      : [];
  }

  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ['backend', invalidation.queryName] })
    .map((query) => query.queryKey);
}

function patchResolvedAttributionUuids(
  command: MutationName,
  params: unknown,
  affectedAttributionUuids: ReadonlySet<string>,
) {
  if (
    (command !== 'resolveAttributions' &&
      command !== 'unresolveAttributions') ||
    typeof params !== 'object' ||
    params === null ||
    !('attributionUuids' in params) ||
    !Array.isArray(params.attributionUuids)
  ) {
    return;
  }

  queryClient.setQueriesData<Set<string>>(
    { queryKey: ['backend', 'resolvedAttributionUuids'] },
    (current) => {
      if (!(current instanceof Set)) {
        return current;
      }
      const next = new Set(current);
      const attributionUuids = params.attributionUuids as unknown[];
      for (const uuid of attributionUuids) {
        if (typeof uuid !== 'string' || !affectedAttributionUuids.has(uuid)) {
          continue;
        }
        if (command === 'resolveAttributions') {
          next.add(uuid);
        } else {
          next.delete(uuid);
        }
      }
      return next;
    },
  );
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
    ) {
      const response = await traceFrontendPhase(
        'mutation.execute',
        { mutation: command },
        () => window.electronAPI.api(command, params),
      );
      const mutationResult = 'result' in response ? response.result : undefined;
      onSuccessBeforeInvalidation?.(mutationResult);
      const attributionCacheImpact =
        'attributionCacheImpact' in response
          ? response.attributionCacheImpact
          : undefined;
      const affectedAttributionUuids =
        attributionCacheImpact?.mode === 'targeted'
          ? attributionCacheImpact.attributionUuids
          : 'affectedAttributionUuids' in response
            ? response.affectedAttributionUuids
            : undefined;
      const hasBroadAttributionCacheImpact =
        attributionCacheImpact?.mode === 'broad';
      const affectedUuids = new Set<string>(affectedAttributionUuids ?? []);
      const secondaryQueryKeys = new Map<string, QueryKey>();
      const immediateQueryKeys = new Map<string, QueryKey>();
      const invalidations =
        'invalidates' in response && response.invalidates
          ? response.invalidates
          : [];
      const invalidatesPaginatedAttributions = invalidations.some(
        (invalidation) => invalidation.queryName === 'listAttributionsPage',
      );

      for (const invalidation of invalidations) {
        if (invalidation.queryName === 'listAttributionsPage') {
          continue;
        }

        const queryKeys = getCachedQueryKeys(invalidation);
        for (const queryKey of queryKeys) {
          const isAffectedDetail =
            affectedUuids.size > 0 &&
            queryParamsContainAffectedAttribution(
              invalidation.queryName,
              queryKey[2],
              affectedUuids,
            );
          const destination = isAffectedDetail
            ? immediateQueryKeys
            : secondaryQueryKeys;
          destination.set(queryKeyHash(queryKey), queryKey);
        }
      }

      try {
        await traceFrontendPhase(
          'mutation.invalidate-immediate',
          { mutation: command, queryCount: immediateQueryKeys.size },
          () =>
            Promise.all(
              [...immediateQueryKeys.values()].map((queryKey) =>
                queryClient.invalidateQueries({
                  queryKey,
                  exact: true,
                }),
              ),
            ).then(() => undefined),
        );
        patchResolvedAttributionUuids(
          command as MutationName,
          params,
          affectedUuids,
        );

        if (invalidatesPaginatedAttributions || affectedUuids.size > 0) {
          await traceFrontendPhase(
            'mutation.reconcile-pages',
            { mutation: command },
            () =>
              enqueueAttributionPageReconciliation({
                queryClient,
                fetchPage: async (pageParams) => {
                  const pageResponse = await window.electronAPI.api(
                    'listAttributionsPage',
                    pageParams,
                  );
                  return pageResponse.result;
                },
              }),
          );
        }
      } catch {
        // The database mutation has already committed. Keep the affected
        // cache entries stale without turning a cache-maintenance failure into
        // a failed user action. They will refresh on activation or the next
        // invalidation.
      }

      if (
        invalidatesPaginatedAttributions ||
        affectedUuids.size > 0 ||
        hasBroadAttributionCacheImpact
      ) {
        void traceFrontendPhase(
          'mutation.invalidate-attribution-navigation',
          { mutation: command },
          () =>
            queryClient
              .invalidateQueries({
                queryKey: ATTRIBUTION_NAVIGATION_QUERY_KEY,
              })
              .then(() => undefined),
        );
      }

      void traceFrontendPhase(
        'mutation.invalidate-secondary',
        { mutation: command, queryCount: secondaryQueryKeys.size },
        () =>
          Promise.all(
            [...secondaryQueryKeys.values()].map((queryKey) =>
              queryClient.invalidateQueries({
                queryKey,
                exact: true,
              }),
            ),
          ).then(() => undefined),
      );
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useMutation: (options?: ClientMutationOptions<any>) => {
        const { onBeforeInvalidation, ...mutationOptions } = options ?? {};
        return useMutation({
          mutationKey: ['backend', command],
          mutationFn: (params) => mutate(params, onBeforeInvalidation),
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
