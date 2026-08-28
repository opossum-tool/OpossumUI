// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  hashKey,
  skipToken,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  AttributionNavigationRequest,
  AttributionPageRequest,
  AttributionResultSetCriteria,
  AttributionResultSetScope,
} from '../../shared/attribution-result-set';
import type { Attributions } from '../../shared/shared-types';
import {
  ATTRIBUTION_PAGE_SIZE,
  getAttributionInfiniteQueryOptions,
  getAttributionPageQueryKey,
  getAttributionPrefixData,
  type InfiniteAttributionData,
} from './attribution-page-query';
import { backend, useDatabaseInitialized } from './backendClient';

type Params = {
  criteria: AttributionResultSetCriteria;
  scope: AttributionResultSetScope;
  sort: AttributionPageRequest['sort'];
  includeReadonly: boolean;
  targetAttributionUuid?: string;
  navigationScope?: AttributionNavigationRequest['navigationScope'];
};

export function useAttributionPages({
  criteria,
  scope,
  sort,
  includeReadonly,
  targetAttributionUuid,
  navigationScope = 'all',
}: Params) {
  const initialized = useDatabaseInitialized();
  const queryClient = useQueryClient();
  const pageRequest = useMemo(
    () => ({ ...criteria, scope, sort, includeReadonly }),
    [criteria, includeReadonly, scope, sort],
  );
  const queryKey = getAttributionPageQueryKey(pageRequest);
  const cachedData =
    queryClient.getQueryData<InfiniteAttributionData>(queryKey);
  const targetAlreadyLoaded = cachedData?.pages.some((page) =>
    targetAttributionUuid
      ? Object.hasOwn(page.attributions, targetAttributionUuid)
      : false,
  );
  const navigationRequest =
    targetAttributionUuid && !targetAlreadyLoaded
      ? ({
          ...criteria,
          sort,
          includeReadonly,
          targetAttributionUuid,
          limit: ATTRIBUTION_PAGE_SIZE,
          navigationScope,
        } satisfies AttributionNavigationRequest)
      : skipToken;
  const targetQuery = backend.locateAttribution.useQuery(navigationRequest);
  const targetFound = targetQuery.data?.found === true;
  const navigationMatchesScope =
    navigationScope === 'all' ||
    targetQuery.data?.found !== true ||
    (scope.mode === 'relation' &&
      targetQuery.data.targetRelation === scope.relation);
  const query = useInfiniteQuery(
    getAttributionInfiniteQueryOptions({
      queryKey,
      enabled:
        initialized &&
        (!targetAttributionUuid ||
          targetAlreadyLoaded ||
          (targetQuery.isSuccess && navigationMatchesScope)),
      fetchPage: (pageParam) =>
        backend.listAttributionsPage.query({ ...pageRequest, ...pageParam }),
    }),
  );
  const seededNavigationRef = useRef<string | null>(null);
  const navigationSeedKey = targetFound
    ? hashKey([
        queryKey,
        targetAttributionUuid,
        navigationScope,
        targetQuery.dataUpdatedAt,
      ])
    : null;

  useEffect(() => {
    if (
      !targetFound ||
      targetQuery.isFetching ||
      seededNavigationRef.current === navigationSeedKey
    ) {
      return;
    }
    const navigationResult = targetQuery.data;
    if (!navigationResult?.found) {
      return;
    }

    queryClient.setQueryData<InfiniteAttributionData>(
      getAttributionPageQueryKey({
        ...criteria,
        scope:
          navigationScope === 'all'
            ? { mode: 'all' }
            : {
                mode: 'relation',
                relation: navigationResult.targetRelation,
              },
        sort,
        includeReadonly,
      }),
      getAttributionPrefixData(navigationResult.prefix),
    );
    seededNavigationRef.current = navigationSeedKey;
  }, [
    criteria,
    includeReadonly,
    navigationScope,
    navigationSeedKey,
    queryClient,
    sort,
    targetFound,
    targetQuery.isFetching,
    targetQuery.data,
  ]);

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
  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage) {
      return;
    }
    await fetchNextPageQuery({ cancelRefetch: false });
  }, [fetchNextPageQuery, hasNextPage]);

  return {
    attributions,
    loading: isLoading || targetQuery.isLoading,
    hasNextPage: hasNextPage ?? false,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    nextPageError: isFetchNextPageError ? error : null,
    navigationLoading: targetQuery.isLoading,
    navigationResult: targetQuery.data,
    navigationAttributions:
      targetQuery.data?.found === true
        ? targetQuery.data.prefix.attributions
        : {},
    navigationRelation:
      targetQuery.data?.found === true ? targetQuery.data.targetRelation : null,
  };
}
