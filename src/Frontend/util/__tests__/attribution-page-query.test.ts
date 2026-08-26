// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import {
  getAttributionInfiniteQueryOptions,
  getAttributionPrefixData,
} from '../attribution-page-query';

describe('attribution page query', () => {
  it('preserves a navigation prefix window during an infinite refetch', async () => {
    const queryClient = new QueryClient();
    const fetchPage = vi.fn(
      (params: { relation: string; offset: number; limit: number }) => ({
        attributions: {},
        offset: params.offset,
        limit: params.limit,
        hasNextPage: false,
      }),
    );
    const options = getAttributionInfiniteQueryOptions({
      queryKey: ['attribution-page-test'],
      enabled: true,
      fetchPage: (pageParam) =>
        Promise.resolve(fetchPage({ relation: 'resource', ...pageParam })),
    });
    const page = {
      attributions: {},
      offset: 0,
      limit: 400,
      hasNextPage: true,
    };

    queryClient.setQueryData(options.queryKey, getAttributionPrefixData(page));
    await queryClient.fetchInfiniteQuery({ ...options, staleTime: 0 });

    expect(fetchPage).toHaveBeenCalledWith({
      relation: 'resource',
      offset: 0,
      limit: 400,
    });
    queryClient.clear();
  });
});
