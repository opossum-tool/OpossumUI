// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryObserver } from '@tanstack/react-query';

import { queryClient } from '../../Components/AppContainer/queryClient';
import { backend } from '../backendClient';

const queryKey = [
  'backend',
  'getAttributionData',
  { attributionUuid: 'attribution-a' },
] as const;

const invalidationResponse = {
  invalidates: [{ queryName: 'getAttributionData' as const }],
};

describe('backend mutation cache ownership', () => {
  beforeEach(() => {
    queryClient.clear();
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

    vi.mocked(window.electronAPI.api).mockResolvedValueOnce(
      invalidationResponse,
    );

    await backend.invalidateGetAttributionData.mutate(undefined);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(queryKey)?.fetchStatus).toBe('fetching');

    resolveRefresh({ value: 'after' });
    await refresh;
    unsubscribe();
  });

  it('refreshes an invalidated secondary query when it becomes active', async () => {
    const queryFn = vi.fn(() => Promise.resolve({ value: 'after' }));
    queryClient.setQueryData(queryKey, { value: 'before' });

    vi.mocked(window.electronAPI.api).mockResolvedValueOnce(
      invalidationResponse,
    );

    await backend.invalidateGetAttributionData.mutate(undefined);

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

    vi.mocked(window.electronAPI.api).mockResolvedValueOnce({
      invalidates: [
        {
          queryName: 'getAttributionData' as const,
          params: { attributionUuid: 'attribution-a' },
        },
      ],
      attributionCacheImpact: {
        mode: 'targeted',
        attributionUuids: ['attribution-a'],
      },
    });

    let mutationSettled = false;
    const mutation = backend.invalidateGetAttributionData
      .mutate(undefined)
      .then(() => {
        mutationSettled = true;
      });
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
    expect(mutationSettled).toBe(false);

    resolveRefresh({ value: 'after' });
    await mutation;
    expect(mutationSettled).toBe(true);
    unsubscribe();
  });

  it('invalidates complete attribution lists for a broad cache impact', async () => {
    const listQueryKey = [
      'backend',
      'listAttributions',
      { external: false },
    ] as const;
    queryClient.setQueryData(listQueryKey, {});
    vi.mocked(window.electronAPI.api).mockResolvedValueOnce({
      invalidates: [{ queryName: 'listAttributions' }],
      attributionCacheImpact: { mode: 'broad' },
    });

    await backend.invalidateGetAttributionData.mutate(undefined);

    await vi.waitFor(() =>
      expect(queryClient.getQueryState(listQueryKey)?.isInvalidated).toBe(true),
    );
  });
});
