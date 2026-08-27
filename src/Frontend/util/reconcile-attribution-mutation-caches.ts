// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { CommandName } from '../../ElectronBackend/api/commands';
import type {
  MutationName,
  MutationParams,
} from '../../ElectronBackend/api/mutations';
import type {
  QueryName,
  QueryParams,
  QueryResult,
} from '../../ElectronBackend/api/queries';
import { traceFrontendPhase } from './frontend-performance-tracing';
import { enqueueAttributionPageReconciliation } from './reconcile-attribution-lists';

export const ATTRIBUTION_NAVIGATION_QUERY_KEY = [
  'backend',
  'locateAttribution',
] as const satisfies QueryKey;

type BackendMutationResponse = {
  result?: unknown;
  invalidates?: Array<{ queryName: QueryName; params?: unknown }>;
  affectedAttributionUuids?: Array<string>;
  attributionCacheImpact?:
    { mode: 'targeted'; attributionUuids: Array<string> } | { mode: 'broad' };
};

type AttributionPageResult = NonNullable<QueryResult<'listAttributionsPage'>>;

function queryKeyForCommand(command: CommandName, params: unknown): QueryKey {
  return ['backend', command, params];
}

function queryParamsContainAffectedAttribution(
  queryName: QueryName,
  params: unknown,
  affectedAttributionUuids: ReadonlySet<string>,
): boolean {
  if (params === undefined || params === null || typeof params !== 'object') {
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

  return (
    queryName === 'resourceAndAttributionAreLinked' &&
    typeof queryParams.attributionUuid === 'string' &&
    affectedAttributionUuids.has(queryParams.attributionUuid)
  );
}

function getCachedQueryKeys(
  queryClient: QueryClient,
  invalidation: { queryName: QueryName; params?: unknown },
): Array<{ queryKey: QueryKey; hash: string }> {
  if (invalidation.params !== undefined) {
    const queryKey = queryKeyForCommand(
      invalidation.queryName,
      invalidation.params,
    );
    const query = queryClient.getQueryCache().find({ queryKey, exact: true });
    return query ? [{ queryKey: query.queryKey, hash: query.queryHash }] : [];
  }

  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ['backend', invalidation.queryName] })
    .map((query) => ({ queryKey: query.queryKey, hash: query.queryHash }));
}

function patchResolvedAttributionUuids(
  queryClient: QueryClient,
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
      for (const uuid of params.attributionUuids as unknown[]) {
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

export async function reconcileAttributionMutationCaches({
  queryClient,
  command,
  params,
  response,
  fetchPage,
}: {
  queryClient: QueryClient;
  command: MutationName;
  params: MutationParams<MutationName>;
  response: BackendMutationResponse;
  fetchPage: (
    params: QueryParams<'listAttributionsPage'>,
  ) => Promise<AttributionPageResult>;
}): Promise<void> {
  const attributionCacheImpact = response.attributionCacheImpact;
  const affectedAttributionUuids =
    attributionCacheImpact?.mode === 'targeted'
      ? attributionCacheImpact.attributionUuids
      : response.affectedAttributionUuids;
  const affectedUuids = new Set<string>(affectedAttributionUuids ?? []);
  const secondaryQueryKeys = new Map<string, QueryKey>();
  const immediateQueryKeys = new Map<string, QueryKey>();
  const invalidations = response.invalidates ?? [];
  const invalidatesPaginatedAttributions = invalidations.some(
    (invalidation) => invalidation.queryName === 'listAttributionsPage',
  );

  for (const invalidation of invalidations) {
    if (invalidation.queryName === 'listAttributionsPage') {
      continue;
    }

    const queryKeys = getCachedQueryKeys(queryClient, invalidation);
    for (const { queryKey, hash } of queryKeys) {
      const destination =
        affectedUuids.size > 0 &&
        queryParamsContainAffectedAttribution(
          invalidation.queryName,
          queryKey[2],
          affectedUuids,
        )
          ? immediateQueryKeys
          : secondaryQueryKeys;
      destination.set(hash, queryKey);
    }
  }

  try {
    await traceFrontendPhase(
      'mutation.invalidate-immediate',
      { mutation: command, queryCount: immediateQueryKeys.size },
      () =>
        Promise.all(
          [...immediateQueryKeys.values()].map((queryKey) =>
            queryClient.invalidateQueries({ queryKey, exact: true }),
          ),
        ).then(() => undefined),
    );
  } catch {
    // Cache maintenance must not turn a committed database mutation into a
    // failed user action.
  }

  patchResolvedAttributionUuids(queryClient, command, params, affectedUuids);

  if (invalidatesPaginatedAttributions || affectedUuids.size > 0) {
    try {
      await traceFrontendPhase(
        'mutation.reconcile-pages',
        { mutation: command },
        () => enqueueAttributionPageReconciliation({ queryClient, fetchPage }),
      );
    } catch {
      // Failed page reconciliation marks the affected queries stale; they can
      // refresh when they become active or receive a later invalidation.
    }
  }

  if (
    invalidatesPaginatedAttributions ||
    affectedUuids.size > 0 ||
    attributionCacheImpact?.mode === 'broad'
  ) {
    void traceFrontendPhase(
      'mutation.invalidate-attribution-navigation',
      { mutation: command },
      () =>
        queryClient
          .invalidateQueries({ queryKey: ATTRIBUTION_NAVIGATION_QUERY_KEY })
          .then(() => undefined),
    ).catch(() => undefined);
  }

  void traceFrontendPhase(
    'mutation.invalidate-secondary',
    { mutation: command, queryCount: secondaryQueryKeys.size },
    () =>
      Promise.all(
        [...secondaryQueryKeys.values()].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey, exact: true }),
        ),
      ).then(() => undefined),
  ).catch(() => undefined);
}
