// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type InfiniteData,
  infiniteQueryOptions,
  type QueryKey,
} from '@tanstack/react-query';

import type { QueryResult } from '../../ElectronBackend/api/queries';
import type { AttributionPageRequest } from '../../shared/attribution-result-set';

export const ATTRIBUTION_PAGE_SIZE = 200;

export type AttributionPageParam = {
  offset: number;
  limit: number;
};

export type AttributionPageParams = Omit<
  AttributionPageRequest,
  'offset' | 'limit'
>;

export type AttributionPageResult = NonNullable<
  QueryResult<'listAttributionsPage'>
>;
export type InfiniteAttributionData = InfiniteData<
  AttributionPageResult,
  AttributionPageParam
>;

const FIRST_ATTRIBUTION_PAGE_PARAM: AttributionPageParam = {
  offset: 0,
  limit: ATTRIBUTION_PAGE_SIZE,
};

export function getAttributionPageQueryKey(
  params: AttributionPageParams,
): readonly ['backend', 'listAttributionsPage', AttributionPageParams] {
  return ['backend', 'listAttributionsPage', params];
}

export function getAttributionInfiniteQueryOptions<TQueryKey extends QueryKey>({
  queryKey,
  enabled,
  fetchPage,
  getNextPageLimit,
}: {
  queryKey: TQueryKey;
  enabled: boolean;
  fetchPage: (
    pageParam: AttributionPageParam,
  ) => Promise<AttributionPageResult>;
  getNextPageLimit?: (nextOffset: number) => number;
}) {
  return infiniteQueryOptions({
    queryKey,
    initialPageParam: FIRST_ATTRIBUTION_PAGE_PARAM,
    enabled,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNextPage) {
        return undefined;
      }

      const nextOffset = lastPage.offset + lastPage.limit;
      return {
        offset: nextOffset,
        limit: getNextPageLimit?.(nextOffset) ?? ATTRIBUTION_PAGE_SIZE,
      };
    },
  });
}

export function getAttributionPrefixData(
  page: AttributionPageResult,
): InfiniteAttributionData {
  return {
    pages: [page],
    pageParams: [{ offset: page.offset, limit: page.limit }],
  };
}

export function getAttributionPrefixDataFromPages(
  data: InfiniteAttributionData,
): InfiniteAttributionData {
  if (data.pages.length === 0) {
    return data;
  }

  const firstPage = data.pages[0];
  const lastPage = data.pages[data.pages.length - 1];
  const page: AttributionPageResult = {
    attributions: Object.fromEntries(
      data.pages.flatMap((currentPage) =>
        Object.entries(currentPage.attributions),
      ),
    ),
    offset: firstPage.offset,
    limit: lastPage.offset + lastPage.limit - firstPage.offset,
    hasNextPage: lastPage.hasNextPage,
  };

  return getAttributionPrefixData(page);
}
