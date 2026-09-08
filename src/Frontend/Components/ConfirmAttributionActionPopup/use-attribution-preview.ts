// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import type { AllMatchingAttributionSelection } from '../../../shared/attribution-selection';
import { backend, useDatabaseInitialized } from '../../util/backendClient';
import { useAttributionPagination } from '../../util/use-attribution-pagination';

export function useAttributionPreview(
  selection: AllMatchingAttributionSelection,
  open: boolean,
  totalCount?: number,
) {
  const initialized = useDatabaseInitialized();
  const queryKey = useMemo(
    () => ['backend', 'listAttributionPreview', selection] as const,
    [selection],
  );
  const query = useAttributionPagination({
    queryKey,
    enabled: initialized && open,
    totalCount,
    fetchPage: (pageParams) =>
      backend.listAttributionPreview.query({
        ...selection.query,
        excludedAttributionUuids: selection.excludedAttributionUuids,
        ...pageParams,
      }),
  });

  return {
    attributions: query.attributions,
    loadingMore: query.isFetchingNextPage,
    loadMoreError: query.nextPageError,
    error: query.isError ? query.error : null,
    retry: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    resultSetKey: query.resultSetKey,
  };
}
