// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  hashKey,
  type QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  ATTRIBUTION_PAGE_SIZE,
  type AttributionPageResult,
  getAttributionInfiniteQueryOptions,
  getAttributionPrefixDataFromPages,
  type InfiniteAttributionData,
} from './attribution-page-query';

type Params<TQueryKey extends QueryKey> = {
  queryKey: TQueryKey;
  enabled: boolean;
  totalCount?: number;
  fetchPage: (pageParam: {
    offset: number;
    limit: number;
  }) => Promise<AttributionPageResult>;
};

export function useAttributionPagination<TQueryKey extends QueryKey>({
  queryKey,
  enabled,
  totalCount,
  fetchPage,
}: Params<TQueryKey>) {
  const queryClient = useQueryClient();
  const queryIdentity = hashKey(queryKey);
  const requestedRangeRef = useRef<{
    queryIdentity: string;
    endIndex: number;
  } | null>(null);
  const query = useInfiniteQuery(
    getAttributionInfiniteQueryOptions({
      queryKey,
      enabled,
      fetchPage,
      getNextPageLimit: (nextOffset) => {
        const requestedEndIndex =
          requestedRangeRef.current?.queryIdentity === queryIdentity
            ? requestedRangeRef.current.endIndex
            : null;
        const requestedLimit =
          requestedEndIndex === null
            ? ATTRIBUTION_PAGE_SIZE
            : Math.max(
                ATTRIBUTION_PAGE_SIZE,
                requestedEndIndex - nextOffset + 1,
              );
        if (totalCount === undefined || totalCount <= nextOffset) {
          return requestedLimit;
        }

        return Math.min(requestedLimit, totalCount - nextOffset);
      },
    }),
  );
  const { fetchNextPage: fetchNextPageQuery, hasNextPage } = query;
  const attributions = useMemo(() => {
    if (!query.data) {
      return null;
    }
    return Object.fromEntries(
      query.data.pages.flatMap((page) => Object.entries(page.attributions)),
    );
  }, [query.data]);
  useEffect(() => {
    requestedRangeRef.current = null;
  }, [queryIdentity]);

  const fetchNextPage = useCallback(
    async (requiredEndIndex?: number) => {
      if (!hasNextPage) {
        return;
      }

      const previousRange = requestedRangeRef.current;
      if (requiredEndIndex !== undefined) {
        const currentEndIndex =
          previousRange?.queryIdentity === queryIdentity
            ? previousRange.endIndex
            : -1;
        requestedRangeRef.current = {
          queryIdentity,
          endIndex: Math.max(currentEndIndex, requiredEndIndex),
        };
      }
      const rangeAtRequest = requestedRangeRef.current;

      const result = await fetchNextPageQuery({ cancelRefetch: false });
      if (!result.isFetchNextPageError) {
        if (rangeAtRequest !== null) {
          queryClient.setQueryData<InfiniteAttributionData>(
            queryKey,
            (data) => data && getAttributionPrefixDataFromPages(data),
          );
        }
        if (requestedRangeRef.current === rangeAtRequest) {
          requestedRangeRef.current = null;
        }
      }
    },
    [fetchNextPageQuery, hasNextPage, queryClient, queryIdentity, queryKey],
  );

  return {
    error: query.error,
    hasNextPage: query.hasNextPage,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    refetch: query.refetch,
    attributions,
    fetchNextPage,
    nextPageError: query.isFetchNextPageError ? query.error : null,
    resultSetKey: queryIdentity,
  };
}
