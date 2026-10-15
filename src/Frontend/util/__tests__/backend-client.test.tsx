// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { backend } from '../backendClient';

describe('backend client mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
  });

  function renderMutation(onBeforeInvalidation?: () => void) {
    return renderHook(
      () => backend.resolveAttributions.useMutation({ onBeforeInvalidation }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );
  }

  it('invalidates the query client from the active provider', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/file']),
      externalAttributions: {
        attributions: {
          external: { id: 'external', criticality: 0 },
        },
        resourcesToAttributions: { '/file': ['external'] },
        attributionsToResources: { external: ['/file'] },
      },
    });

    const queryKey = ['backend', 'resolvedAttributionUuids'] as const;
    const queryFn = vi.fn(() => Promise.resolve(new Set<string>()));
    queryClient.setQueryData(queryKey, new Set<string>());
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);

    const { result } = renderMutation();

    await act(async () => {
      await result.current.mutateAsync({
        selection: { mode: 'explicit', attributionUuids: ['external'] },
      });
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('accepts the result before invalidation and stays pending until invalidation completes', async () => {
    const invalidation = Promise.withResolvers<void>();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(invalidation.promise);
    const onBeforeInvalidation = vi.fn();
    vi.mocked(window.electronAPI.api).mockResolvedValueOnce({
      result: undefined,
      invalidates: [
        { queryName: 'resolvedAttributionUuids', awaitRefetch: true },
      ],
    });
    const { result } = renderMutation(onBeforeInvalidation);

    act(() => {
      result.current.mutate({
        selection: { mode: 'explicit', attributionUuids: ['external'] },
      });
    });
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledOnce());
    expect(onBeforeInvalidation).toHaveBeenCalledBefore(invalidateQueries);
    expect(result.current.isPending).toBe(true);

    act(() => invalidation.resolve());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
