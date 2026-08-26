// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type {
  QueryParams,
  QueryResult,
} from '../../ElectronBackend/api/queries';
import type { Attributions } from '../../shared/shared-types';
import {
  type AttributionPageParam,
  type AttributionPageParams,
  getAttributionPrefixData,
  getLoadedAttributionWindow,
  type InfiniteAttributionData,
} from './attribution-page-query';
import { traceFrontendPhase } from './frontend-performance-tracing';
import { sortAttributions } from './sort-attributions';

type ListAttributionsParams = QueryParams<'listAttributions'>;
type ListAttributionsResult = NonNullable<QueryResult<'listAttributions'>>;
type ListAttributionsPageResult = NonNullable<
  QueryResult<'listAttributionsPage'>
>;

const LIST_ATTRIBUTIONS_QUERY_KEY = [
  'backend',
  'listAttributions',
] as const satisfies QueryKey;
const TARGETED_FETCH_BATCH_SIZE = 500;
export type ReconcileAttributionListsOptions = {
  queryClient: QueryClient;
  affectedAttributionUuids: Array<string>;
  fetchAttributions: (
    params: ListAttributionsParams,
  ) => Promise<ListAttributionsResult>;
};

export type ReconcileAttributionPagesOptions = {
  queryClient: QueryClient;
  fetchPage: (
    params: AttributionPageParams & AttributionPageParam,
  ) => Promise<ListAttributionsPageResult>;
};

let reconciliationQueue: Promise<void> = Promise.resolve();
let pageReconciliationQueue: Promise<void> = Promise.resolve();

export function enqueueAttributionListReconciliation(
  options: ReconcileAttributionListsOptions,
): Promise<void> {
  const currentReconciliation = reconciliationQueue.then(() =>
    reconcileAttributionLists(options),
  );
  // Keep the queue usable after a failure, but return the original promise so
  // the mutation that triggered the failed reconciliation still rejects.
  reconciliationQueue = currentReconciliation.catch(() => {});
  return currentReconciliation;
}

export async function reconcileAttributionPages({
  queryClient,
  fetchPage,
}: ReconcileAttributionPagesOptions): Promise<void> {
  const queries = queryClient.getQueryCache().findAll({
    queryKey: ['backend', 'listAttributionsPage'],
  });

  const errors: Array<unknown> = [];
  for (const query of queries) {
    if (!query.isActive()) {
      await queryClient.invalidateQueries({
        queryKey: query.queryKey,
        exact: true,
        refetchType: 'none',
      });
      continue;
    }

    const currentData = query.state.data as InfiniteAttributionData | undefined;
    const loadedWindow = getLoadedAttributionWindow(currentData);
    const params = query.queryKey[2] as AttributionPageParams;

    await queryClient.cancelQueries({
      queryKey: query.queryKey,
      exact: true,
    });
    if (
      queryClient.getQueryCache().find({
        queryKey: query.queryKey,
        exact: true,
      }) !== query
    ) {
      continue;
    }

    try {
      const page = await traceFrontendPhase(
        'attribution-page-reconcile',
        {
          external: params.external ?? false,
          relation: params.relation,
          loadedWindow,
          requestedLimit: loadedWindow,
        },
        () =>
          fetchPage({
            ...params,
            offset: 0,
            limit: loadedWindow,
          }),
      );
      if (
        queryClient.getQueryCache().find({
          queryKey: query.queryKey,
          exact: true,
        }) !== query
      ) {
        continue;
      }
      queryClient.setQueryData<InfiniteAttributionData>(
        query.queryKey,
        getAttributionPrefixData(page),
      );
    } catch (error) {
      await queryClient.invalidateQueries({
        queryKey: query.queryKey,
        exact: true,
        refetchType: 'none',
      });
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      'Failed to reconcile paginated attribution lists',
    );
  }
}

export function enqueueAttributionPageReconciliation(
  options: ReconcileAttributionPagesOptions,
): Promise<void> {
  const currentReconciliation = pageReconciliationQueue.then(() =>
    reconcileAttributionPages(options),
  );
  pageReconciliationQueue = currentReconciliation.catch(() => {});
  return currentReconciliation;
}

async function reconcileAttributionLists(
  options: ReconcileAttributionListsOptions,
): Promise<void> {
  const queries = getDistinctAttributionListQueries(options.queryClient);
  const activeQueries = queries.filter((query) => query.isActive());
  const inactiveQueries = queries.filter((query) => !query.isActive());

  await Promise.all(
    inactiveQueries.map((query) =>
      options.queryClient.invalidateQueries({
        queryKey: query.queryKey,
        exact: true,
        refetchType: 'none',
      }),
    ),
  );

  const errors: Array<unknown> = [];
  for (const query of activeQueries) {
    try {
      await reconcileActiveQuery(query, options);
    } catch (targetedError) {
      if (!isCurrentQuery(options.queryClient, query)) {
        continue;
      }

      try {
        await options.queryClient.invalidateQueries({
          queryKey: query.queryKey,
          exact: true,
        });
      } catch (fallbackError) {
        errors.push(new AggregateError([targetedError, fallbackError]));
      }
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, 'Failed to reconcile attribution lists');
  }
}

function getDistinctAttributionListQueries(queryClient: QueryClient) {
  const queries = queryClient.getQueryCache().findAll({
    queryKey: LIST_ATTRIBUTIONS_QUERY_KEY,
  });
  const queriesByHash = new Map<string, (typeof queries)[number]>();

  for (const query of queries) {
    queriesByHash.set(query.queryHash, query);
  }

  return [...queriesByHash.values()];
}

async function reconcileActiveQuery(
  query: ReturnType<typeof getDistinctAttributionListQueries>[number],
  options: ReconcileAttributionListsOptions,
) {
  if (!isCurrentQuery(options.queryClient, query)) {
    return;
  }

  const params = query.queryKey[2] as ListAttributionsParams;
  const cachedAttributions = query.state.data as Attributions | undefined;

  if (cachedAttributions === undefined) {
    await options.queryClient.invalidateQueries({
      queryKey: query.queryKey,
      exact: true,
    });
    return;
  }

  const affectedUuids = params.uuids
    ? options.affectedAttributionUuids.filter((uuid) =>
        params.uuids?.includes(uuid),
      )
    : options.affectedAttributionUuids;

  if (affectedUuids.length === 0) {
    return;
  }

  if (affectedUuids.length >= Object.keys(cachedAttributions).length) {
    await options.queryClient.invalidateQueries({
      queryKey: query.queryKey,
      exact: true,
    });
    return;
  }

  await options.queryClient.cancelQueries({
    queryKey: query.queryKey,
    exact: true,
  });
  if (!isCurrentQuery(options.queryClient, query)) {
    return;
  }

  const targetedAttributions: Attributions = {};
  for (
    let start = 0;
    start < affectedUuids.length;
    start += TARGETED_FETCH_BATCH_SIZE
  ) {
    Object.assign(
      targetedAttributions,
      await options.fetchAttributions({
        ...params,
        uuids: affectedUuids.slice(start, start + TARGETED_FETCH_BATCH_SIZE),
      }),
    );
  }

  if (!isCurrentQuery(options.queryClient, query)) {
    return;
  }

  // Cancel again immediately before the atomic cache update so an older full
  // list response cannot overwrite the reconciled result.
  await options.queryClient.cancelQueries({
    queryKey: query.queryKey,
    exact: true,
  });
  if (!isCurrentQuery(options.queryClient, query)) {
    return;
  }

  options.queryClient.setQueryData<Attributions>(
    query.queryKey,
    (currentAttributions) => {
      const reconciledAttributions = {
        ...(currentAttributions ?? cachedAttributions),
      };
      affectedUuids.forEach((uuid) => {
        delete reconciledAttributions[uuid];
      });
      Object.assign(reconciledAttributions, targetedAttributions);

      return sortAttributions({
        attributions: reconciledAttributions,
        sorting: params.sort ?? 'alphabetically',
      });
    },
  );
}

function isCurrentQuery(
  queryClient: QueryClient,
  query: ReturnType<typeof getDistinctAttributionListQueries>[number],
) {
  return (
    queryClient.getQueryCache().find({
      queryKey: query.queryKey,
      exact: true,
    }) === query
  );
}
