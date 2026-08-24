// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../shared/attribution-filters';
import type { Attributions, Relation } from '../../shared/shared-types';
import type { SortOption } from '../Components/SortButton/useSortingOptions';
import { backend, useDatabaseInitialized } from './backendClient';

const ATTRIBUTION_PAGE_SIZE = 200;

type Params = {
  external: boolean;
  filters: Array<AttributionFilterKey>;
  search: string;
  sort: SortOption;
  valueFilters: AttributionValueFilters;
  resourcePathForRelationships: string;
  showResolved: boolean;
  excludeUnrelated: boolean;
  includeReadonly: boolean;
  relation: Relation;
};

export function useInfiniteAttributionsList(params: Params) {
  const initialized = useDatabaseInitialized();
  const query = useInfiniteQuery({
    queryKey: ['backend', 'listAttributionsPage', params],
    initialPageParam: 0,
    enabled: initialized,
    queryFn: ({ pageParam }) =>
      backend.listAttributionsPage.query({
        ...params,
        offset: pageParam,
        limit: ATTRIBUTION_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage
        ? lastPage.offset + Object.keys(lastPage.attributions).length
        : undefined,
  });
  const { relation: _relation, sort: _sort, ...countParams } = params;
  const relationCountsQuery = backend.listAttributionRelationCounts.useQuery(
    countParams,
    {
      enabled: initialized,
    },
  );

  const {
    data,
    error,
    fetchNextPage: fetchNextPageQuery,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = query;
  const attributions = useMemo<Attributions | null>(() => {
    if (!data) {
      return null;
    }

    return Object.fromEntries(
      data.pages.flatMap((page) => Object.entries(page.attributions)),
    );
  }, [data]);
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

  return {
    attributions,
    loading: isLoading,
    relation: params.relation,
    relationCounts: relationCountsQuery.data,
    hasNextPage: hasNextPage ?? false,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    nextPageError: isFetchNextPageError ? error : null,
  };
}
