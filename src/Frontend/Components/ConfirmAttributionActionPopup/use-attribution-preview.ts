// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import type { Attributions } from '../../../shared/shared-types';
import { backend, useDatabaseInitialized } from '../../util/backendClient';

const PREVIEW_PAGE_SIZE = 200;

export function useAttributionPreview(
  selection: AttributionSelection | undefined,
  open: boolean,
) {
  const initialized = useDatabaseInitialized();
  const query = useInfiniteQuery({
    queryKey: ['attribution-selection-preview', selection],
    initialPageParam: 0,
    enabled: initialized && open && selection?.mode === 'allMatching',
    queryFn: ({ pageParam }) => {
      if (selection?.mode !== 'allMatching') {
        throw new Error('An all-matching selection is required for preview');
      }

      return backend.listAttributionsPage.query({
        ...selection.query,
        excludedAttributionUuids: selection.excludedAttributionUuids,
        includeReadonly: false,
        offset: pageParam,
        limit: PREVIEW_PAGE_SIZE,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage
        ? lastPage.offset + Object.keys(lastPage.attributions).length
        : undefined,
  });
  const {
    fetchNextPage: fetchNextPageQuery,
    hasNextPage,
    isFetchingNextPage,
  } = query;
  const fetchLockRef = useRef(false);
  const fetchNextPage = useCallback(async () => {
    if (fetchLockRef.current || !hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchLockRef.current = true;
    try {
      await fetchNextPageQuery();
    } finally {
      fetchLockRef.current = false;
    }
  }, [fetchNextPageQuery, hasNextPage, isFetchingNextPage]);
  const attributions = useMemo<Attributions | null>(() => {
    if (!query.data) {
      return null;
    }

    return Object.fromEntries(
      query.data.pages.flatMap((page) => Object.entries(page.attributions)),
    );
  }, [query.data]);

  return {
    attributions,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    loadMoreError: query.isFetchNextPageError ? query.error : null,
    error: query.isError ? query.error : null,
    retry: query.refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
  };
}
