// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { AllMatchingAttributionSelection } from '../../../shared/attribution-selection';
import type { Attributions } from '../../../shared/shared-types';
import { getAttributionInfiniteQueryOptions } from '../../util/attribution-page-query';
import { backend, useDatabaseInitialized } from '../../util/backendClient';

export function useAttributionPreview(
  selection: AllMatchingAttributionSelection,
  open: boolean,
) {
  const initialized = useDatabaseInitialized();
  const query = useInfiniteQuery(
    getAttributionInfiniteQueryOptions({
      queryKey: ['attribution-selection-preview', selection],
      enabled: initialized && open,
      fetchPage: (pageParams) =>
        backend.listAttributionPreview.query({
          ...selection.query,
          excludedAttributionUuids: selection.excludedAttributionUuids,
          ...pageParams,
        }),
    }),
  );
  const { fetchNextPage: fetchNextPageQuery, hasNextPage } = query;
  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage) {
      return;
    }
    await fetchNextPageQuery({ cancelRefetch: false });
  }, [fetchNextPageQuery, hasNextPage]);
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
    loadingMore: query.isFetchingNextPage,
    loadMoreError: query.isFetchNextPageError ? query.error : null,
    error: query.isError ? query.error : null,
    retry: query.refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
  };
}
