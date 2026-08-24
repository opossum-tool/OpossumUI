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
  relation: Relation | undefined;
};

export function useInfiniteAttributionsList(params: Params) {
  const initialized = useDatabaseInitialized();
  const { relation: requestedRelation, sort: _sort, ...countParams } = params;
  const relationCountsQuery = backend.listAttributionRelationCounts.useQuery(
    countParams,
    {
      enabled: initialized,
    },
  );
  const relation = useMemo(() => {
    const relationCounts = relationCountsQuery.data;
    if (!relationCounts) {
      return undefined;
    }

    if (requestedRelation && relationCounts[requestedRelation] !== undefined) {
      return requestedRelation;
    }

    return (['resource', 'parents', 'children', 'unrelated'] as const).find(
      (candidate) => relationCounts[candidate] !== undefined,
    );
  }, [relationCountsQuery.data, requestedRelation]);

  const query = useInfiniteQuery({
    queryKey: ['backend', 'listAttributionsPage', { ...params, relation }],
    initialPageParam: 0,
    enabled: initialized && relation !== undefined,
    queryFn: ({ pageParam }) =>
      backend.listAttributionsPage.query({
        ...params,
        relation,
        offset: pageParam,
        limit: ATTRIBUTION_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage
        ? lastPage.offset + Object.keys(lastPage.attributions).length
        : undefined,
  });

  const {
    data,
    error,
    fetchNextPage: fetchNextPageQuery,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
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
    loading:
      relationCountsQuery.isLoading || (relation !== undefined && isLoading),
    relation,
    relationCounts: relationCountsQuery.data,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
    nextPageError: isFetchNextPageError ? error : null,
  };
}
