// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryObserver } from '@tanstack/react-query';

import {
  ATTRIBUTION_NAVIGATION_QUERY_KEY,
  reconcileAttributionMutationCaches,
} from '../reconcile-attribution-mutation-caches';

const queryKey = [
  'backend',
  'getAttributionData',
  { attributionUuid: 'attribution-a' },
] as const;

const invalidationResponse = {
  invalidates: [{ queryName: 'getAttributionData' as const }],
};

const fetchPage = vi.fn(() =>
  Promise.resolve({
    attributions: {},
    offset: 0,
    limit: 200,
    hasNextPage: false,
  }),
);

describe('reconcileAttributionMutationCaches', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    fetchPage.mockClear();
  });

  it('starts active secondary refreshes without awaiting their completion', async () => {
    let resolveRefresh: (value: { value: string }) => void = () => undefined;
    const refresh = new Promise<{ value: string }>((resolve) => {
      resolveRefresh = resolve;
    });
    const queryFn = vi.fn(() => refresh);
    queryClient.setQueryData(queryKey, { value: 'before' });
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    await reconcileAttributionMutationCaches({
      queryClient,
      command: 'invalidateGetAttributionData',
      params: undefined,
      response: invalidationResponse,
      fetchPage,
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(queryKey)?.fetchStatus).toBe('fetching');

    resolveRefresh({ value: 'after' });
    await refresh;
    unsubscribe();
  });

  it('refreshes an invalidated secondary query when it becomes active', async () => {
    const queryFn = vi.fn(() => Promise.resolve({ value: 'after' }));
    queryClient.setQueryData(queryKey, { value: 'before' });

    await reconcileAttributionMutationCaches({
      queryClient,
      command: 'invalidateGetAttributionData',
      params: undefined,
      response: invalidationResponse,
      fetchPage,
    });

    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    expect(queryFn).not.toHaveBeenCalled();

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false),
    );
    unsubscribe();
  });

  it('awaits an active detail refresh when its attribution is identified', async () => {
    let resolveRefresh: (value: { value: string }) => void = () => undefined;
    const refresh = new Promise<{ value: string }>((resolve) => {
      resolveRefresh = resolve;
    });
    const queryFn = vi.fn(() => refresh);
    queryClient.setQueryData(queryKey, { value: 'before' });
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    const response = {
      invalidates: [
        {
          queryName: 'getAttributionData' as const,
          params: { attributionUuid: 'attribution-a' },
        },
      ],
      attributionCacheImpact: {
        mode: 'targeted' as const,
        attributionUuids: ['attribution-a'],
      },
    };

    let mutationSettled = false;
    const mutation = reconcileAttributionMutationCaches({
      queryClient,
      command: 'invalidateGetAttributionData',
      params: undefined,
      response,
      fetchPage,
    }).then(() => {
      mutationSettled = true;
    });
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    expect(mutationSettled).toBe(false);

    resolveRefresh({ value: 'after' });
    await mutation;
    expect(mutationSettled).toBe(true);
    unsubscribe();
  });

  it('invalidates targeted attribution lookups for a broad cache impact', async () => {
    const listQueryKey = [
      'backend',
      'getAttributions',
      { attributionUuids: ['attribution-a'] },
    ] as const;
    queryClient.setQueryData(listQueryKey, {});
    await reconcileAttributionMutationCaches({
      queryClient,
      command: 'invalidateGetAttributionData',
      params: undefined,
      response: {
        invalidates: [{ queryName: 'getAttributions' }],
        attributionCacheImpact: { mode: 'broad' },
      },
      fetchPage,
    });

    await vi.waitFor(() =>
      expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true),
    );
  });

  it('invalidates cached attribution navigation after list-affecting mutations', async () => {
    expect(ATTRIBUTION_NAVIGATION_QUERY_KEY).toEqual([
      'backend',
      'locateAttribution',
    ]);
    const navigationQueryKey = [
      ...ATTRIBUTION_NAVIGATION_QUERY_KEY,
      { targetAttributionUuid: 'attribution-a' },
    ] as const;
    queryClient.setQueryData(navigationQueryKey, {
      found: true,
      targetRelation: 'resource',
      offset: 0,
      prefix: {
        attributions: {},
        offset: 0,
        limit: 200,
        hasNextPage: false,
      },
    });
    await reconcileAttributionMutationCaches({
      queryClient,
      command: 'invalidateGetAttributionData',
      params: undefined,
      response: {
        invalidates: [{ queryName: 'listAttributionsPage' as const }],
        attributionCacheImpact: { mode: 'broad' as const },
      },
      fetchPage,
    });

    await vi.waitFor(() =>
      expect(queryClient.getQueryState(navigationQueryKey)?.isInvalidated).toBe(
        true,
      ),
    );
  });
});
