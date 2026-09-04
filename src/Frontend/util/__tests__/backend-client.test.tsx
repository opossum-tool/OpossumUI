// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  QueryClient,
  QueryClientProvider,
  QueryObserver,
} from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { backend } from '../backendClient';

describe('backend client mutations', () => {
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

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
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

    const { result } = renderHook(
      () => backend.resolveAttributions.useMutation(),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    await act(async () => {
      await result.current.mutateAsync({
        selection: { mode: 'explicit', attributionUuids: ['external'] },
      });
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
