// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';

import { getAttributionInfiniteQueryOptions } from '../attribution-page-query';
import {
  invalidateMutationQueries,
  removeFocusedAttributionQuery,
} from '../invalidate-mutation-queries';

describe('invalidateMutationQueries', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('removes a removed focused attribution before broad invalidation', async () => {
    const removedQueryKey = [
      'backend',
      'getAttributionData',
      { attributionUuid: 'removed' },
    ] as const;
    const remainingQueryKey = [
      'backend',
      'getAttributionData',
      { attributionUuid: 'remaining' },
    ] as const;
    const removedQueryFn = vi.fn(() => Promise.reject(new Error('no result')));
    const remainingQueryFn = vi.fn(() => Promise.resolve({ value: 'after' }));
    queryClient.setQueryData(removedQueryKey, { value: 'before' });
    queryClient.setQueryData(remainingQueryKey, { value: 'before' });
    const removedObserver = new QueryObserver(queryClient, {
      queryKey: removedQueryKey,
      queryFn: removedQueryFn,
      staleTime: Infinity,
    });
    const remainingObserver = new QueryObserver(queryClient, {
      queryKey: remainingQueryKey,
      queryFn: remainingQueryFn,
      staleTime: Infinity,
    });
    const unsubscribeRemoved = removedObserver.subscribe(() => undefined);
    const unsubscribeRemaining = remainingObserver.subscribe(() => undefined);

    removeFocusedAttributionQuery({
      queryClient,
      outcome: { status: 'removed', attributionUuid: 'removed' },
    });
    await invalidateMutationQueries({
      queryClient,
      invalidations: [{ queryName: 'getAttributionData', awaitRefetch: true }],
    });

    expect(removedQueryFn).not.toHaveBeenCalled();
    expect(remainingQueryFn).toHaveBeenCalledTimes(1);
    expect(
      queryClient.getQueryCache().find({ queryKey: removedQueryKey }),
    ).toBe(undefined);

    unsubscribeRemoved();
    unsubscribeRemaining();
  });

  it('keeps the focused attribution query for an unchanged outcome', () => {
    const queryKey = [
      'backend',
      'getAttributionData',
      { attributionUuid: 'unchanged' },
    ] as const;
    queryClient.setQueryData(queryKey, { value: 'before' });

    removeFocusedAttributionQuery({
      queryClient,
      outcome: { status: 'unchanged' },
    });

    expect(queryClient.getQueryData(queryKey)).toEqual({ value: 'before' });
  });

  it('removes the old query for a remapped outcome', () => {
    const queryKey = [
      'backend',
      'getAttributionData',
      { attributionUuid: 'old' },
    ] as const;
    queryClient.setQueryData(queryKey, { value: 'before' });

    removeFocusedAttributionQuery({
      queryClient,
      outcome: {
        status: 'remapped',
        attributionUuid: 'old',
        newAttributionUuid: 'new',
      },
    });

    expect(queryClient.getQueryCache().find({ queryKey })).toBe(undefined);
  });

  it('starts background refreshes without awaiting them', async () => {
    let resolveRefresh: (value: { value: string }) => void = () => undefined;
    const refresh = new Promise<{ value: string }>((resolve) => {
      resolveRefresh = resolve;
    });
    const queryKey = ['backend', 'getAttributionData'] as const;
    const queryFn = vi.fn(() => refresh);
    queryClient.setQueryData(queryKey, { value: 'before' });
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    await invalidateMutationQueries({
      queryClient,
      invalidations: [{ queryName: 'getAttributionData' }],
    });

    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    expect(queryClient.getQueryState(queryKey)?.fetchStatus).toBe('fetching');

    resolveRefresh({ value: 'after' });
    await refresh;
    unsubscribe();
  });

  it('awaits active refreshes marked as required', async () => {
    let resolveRefresh: (value: { value: string }) => void = () => undefined;
    const refresh = new Promise<{ value: string }>((resolve) => {
      resolveRefresh = resolve;
    });
    const queryKey = ['backend', 'getAttributionData'] as const;
    const queryFn = vi.fn(() => refresh);
    queryClient.setQueryData(queryKey, { value: 'before' });
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    let settled = false;
    const invalidation = invalidateMutationQueries({
      queryClient,
      invalidations: [{ queryName: 'getAttributionData', awaitRefetch: true }],
    }).then(() => {
      settled = true;
    });
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    expect(settled).toBe(false);

    resolveRefresh({ value: 'after' });
    await invalidation;
    expect(settled).toBe(true);
    unsubscribe();
  });

  it('prioritizes awaited refreshes before starting background refreshes', async () => {
    let resolveAwaited: (value: { value: string }) => void = () => undefined;
    const awaitedRefresh = new Promise<{ value: string }>((resolve) => {
      resolveAwaited = resolve;
    });
    let resolveBackground: (value: { value: string }) => void = () => undefined;
    const backgroundRefresh = new Promise<{ value: string }>((resolve) => {
      resolveBackground = resolve;
    });
    const awaitedQueryKey = [
      'backend',
      'getAttributionData',
      { attributionUuid: 'attribution-a' },
    ] as const;
    const backgroundQueryKey = ['backend', 'resolvedAttributionUuids'] as const;
    const awaitedQueryFn = vi.fn(() => awaitedRefresh);
    const backgroundQueryFn = vi.fn(() => backgroundRefresh);
    queryClient.setQueryData(awaitedQueryKey, { value: 'before' });
    queryClient.setQueryData(backgroundQueryKey, { value: 'before' });
    const awaitedObserver = new QueryObserver(queryClient, {
      queryKey: awaitedQueryKey,
      queryFn: awaitedQueryFn,
      staleTime: Infinity,
    });
    const backgroundObserver = new QueryObserver(queryClient, {
      queryKey: backgroundQueryKey,
      queryFn: backgroundQueryFn,
      staleTime: Infinity,
    });
    const unsubscribeAwaited = awaitedObserver.subscribe(() => undefined);
    const unsubscribeBackground = backgroundObserver.subscribe(() => undefined);

    const invalidation = invalidateMutationQueries({
      queryClient,
      invalidations: [
        { queryName: 'getAttributionData', awaitRefetch: true },
        { queryName: 'resolvedAttributionUuids' },
      ],
    });
    await vi.waitFor(() => expect(awaitedQueryFn).toHaveBeenCalledTimes(1));
    expect(backgroundQueryFn).not.toHaveBeenCalled();

    resolveAwaited({ value: 'after' });
    await invalidation;
    await vi.waitFor(() => expect(backgroundQueryFn).toHaveBeenCalledTimes(1));

    resolveBackground({ value: 'after' });
    await backgroundRefresh;
    unsubscribeAwaited();
    unsubscribeBackground();
  });

  it('refetches every loaded page of an awaited infinite query', async () => {
    const queryKey = ['backend', 'listAttributionsPage'] as const;
    const fetchPage = vi.fn(
      ({ offset, limit }: { offset: number; limit: number }) =>
        Promise.resolve({
          attributions: {},
          offset,
          limit,
          hasNextPage: offset === 0,
        }),
    );
    const options = getAttributionInfiniteQueryOptions({
      queryKey,
      enabled: true,
      fetchPage,
    });
    queryClient.setQueryData(queryKey, {
      pages: [
        { attributions: {}, offset: 0, limit: 200, hasNextPage: true },
        { attributions: {}, offset: 200, limit: 200, hasNextPage: false },
      ],
      pageParams: [
        { offset: 0, limit: 200 },
        { offset: 200, limit: 200 },
      ],
    });
    const observer = new InfiniteQueryObserver(queryClient, {
      ...options,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    await invalidateMutationQueries({
      queryClient,
      invalidations: [
        { queryName: 'listAttributionsPage', awaitRefetch: true },
      ],
    });

    expect(fetchPage).toHaveBeenCalledWith({ offset: 0, limit: 200 });
    expect(fetchPage).toHaveBeenCalledWith({ offset: 200, limit: 200 });
    unsubscribe();
  });
});
