// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { QueryResult } from '../../ElectronBackend/api/queries';
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../shared/attribution-filters';
import type { Attributions, Relation } from '../../shared/shared-types';
import type { SortOption } from '../Components/SortButton/useSortingOptions';
import {
  ATTRIBUTION_NAVIGATION_QUERY_KEY,
  backend,
  useDatabaseInitialized,
} from './backendClient';

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

type PageResult = NonNullable<QueryResult<'listAttributionsPage'>>;
type InfiniteAttributionData = InfiniteData<PageResult, number>;

export function useInfiniteAttributionsList(
  params: Params,
  targetAttributionUuid?: string,
) {
  const initialized = useDatabaseInitialized();
  const queryClient = useQueryClient();
  const queryKey = ['backend', 'listAttributionsPage', params] as const;
  const cachedData =
    queryClient.getQueryData<InfiniteAttributionData>(queryKey);
  const targetAlreadyLoaded = cachedData?.pages.some((page) =>
    targetAttributionUuid
      ? Object.hasOwn(page.attributions, targetAttributionUuid)
      : false,
  );
  const targetQuery = useQuery({
    queryKey: [
      ...ATTRIBUTION_NAVIGATION_QUERY_KEY,
      params,
      targetAttributionUuid,
    ],
    enabled: initialized && !!targetAttributionUuid && !targetAlreadyLoaded,
    queryFn: () =>
      backend.listAttributionsPage.query({
        ...params,
        targetAttributionUuid,
        offset: 0,
        limit: ATTRIBUTION_PAGE_SIZE,
      }),
  });
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    enabled:
      initialized &&
      (!targetAttributionUuid ||
        targetAlreadyLoaded ||
        (targetQuery.isSuccess &&
          (!targetQuery.data?.relation ||
            targetQuery.data.relation === params.relation))),
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

  useEffect(() => {
    const navigationResult = targetQuery.data;
    if (
      !navigationResult?.relation ||
      navigationResult.targetOffset === undefined
    ) {
      return;
    }

    queryClient.setQueryData<InfiniteAttributionData>(
      [
        'backend',
        'listAttributionsPage',
        { ...params, relation: navigationResult.relation },
      ],
      {
        pages: [navigationResult],
        pageParams: [0],
      },
    );
  }, [params, queryClient, targetQuery.data]);
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
    loading: isLoading || targetQuery.isLoading,
    relation: params.relation,
    relationCounts: relationCountsQuery.data,
    hasNextPage: hasNextPage ?? false,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    nextPageError: isFetchNextPageError ? error : null,
    navigationLoading: targetQuery.isLoading,
    navigationResult: targetQuery.data,
  };
}
