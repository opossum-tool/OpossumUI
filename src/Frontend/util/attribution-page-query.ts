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
}: {
  queryKey: TQueryKey;
  enabled: boolean;
  fetchPage: (
    pageParam: AttributionPageParam,
  ) => Promise<AttributionPageResult>;
}) {
  return infiniteQueryOptions({
    queryKey,
    initialPageParam: FIRST_ATTRIBUTION_PAGE_PARAM,
    enabled,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage
        ? {
            offset: lastPage.offset + lastPage.limit,
            limit: ATTRIBUTION_PAGE_SIZE,
          }
        : undefined,
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

export function getLoadedAttributionWindow(
  data: InfiniteAttributionData | undefined,
): number {
  return Math.max(
    ATTRIBUTION_PAGE_SIZE,
    ...(data?.pages.map((page) => page.offset + page.limit) ?? []),
  );
}
