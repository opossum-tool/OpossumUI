// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { QueryClient } from '@tanstack/react-query';

import type { QueryResult } from '../../ElectronBackend/api/queries';
import {
  type AttributionPageParam,
  type AttributionPageParams,
  getAttributionPrefixData,
  getLoadedAttributionWindow,
  type InfiniteAttributionData,
} from './attribution-page-query';
import { traceFrontendPhase } from './frontend-performance-tracing';

type ListAttributionsPageResult = NonNullable<
  QueryResult<'listAttributionsPage'>
>;

export type ReconcileAttributionPagesOptions = {
  queryClient: QueryClient;
  fetchPage: (
    params: AttributionPageParams & AttributionPageParam,
  ) => Promise<ListAttributionsPageResult>;
};

let pageReconciliationQueue: Promise<void> = Promise.resolve();

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
          scope:
            params.scope.mode === 'relation'
              ? params.scope.relation
              : params.scope.mode,
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
