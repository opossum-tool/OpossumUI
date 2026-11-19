// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import { useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';

/**
 * Largest query-wide selection for which the attribution UUIDs are
 * materialized so the linked resources tree can be rendered. Larger
 * selections keep the tree hidden.
 */
const QUERY_WIDE_TREE_LIMIT = 100;

export function useAttributionSelectionData({
  open,
  isMutationPending = false,
  selection,
}: {
  open: boolean;
  isMutationPending?: boolean;
  selection: AttributionSelection;
}) {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const queryWideSelection =
    selection.mode === 'allMatching' ? selection : undefined;
  const isQueryWideSelection = queryWideSelection !== undefined;
  const explicitAttributionUuids =
    selection.mode === 'explicit' ? selection.attributionUuids : [];
  const isEmptySelection =
    !isQueryWideSelection && explicitAttributionUuids.length === 0;

  const { data: fetchedAttributions, isSuccess: areAttributionsReady } =
    backend.getAttributionPreview.useQuery(
      open && !isMutationPending && !isQueryWideSelection && !isEmptySelection
        ? {
            attributionUuids: explicitAttributionUuids,
            resourcePathForRelationships: selectedResourceId,
          }
        : skipToken,
    );

  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    { selection },
    { enabled: open && !isMutationPending && isQueryWideSelection },
  );
  const summary = selectionSummaryQuery.data;
  const attributionUuidsQuery = backend.getAttributionSelectionUuids.useQuery(
    open && !isMutationPending && queryWideSelection
      ? { selection: queryWideSelection, limit: QUERY_WIDE_TREE_LIMIT }
      : skipToken,
  );
  const limitExceeded = attributionUuidsQuery.data?.limitExceeded ?? false;
  const areAttributionUuidsResolved = !isQueryWideSelection
    ? true
    : attributionUuidsQuery.isSuccess || attributionUuidsQuery.isError;
  const attributionIds = isQueryWideSelection
    ? limitExceeded
      ? []
      : (attributionUuidsQuery.data?.attributionUuids ?? [])
    : explicitAttributionUuids;
  const areAttributionUuidsPending =
    isQueryWideSelection && !areAttributionUuidsResolved;
  const canShowLinkedResourcesTree = isQueryWideSelection
    ? areAttributionUuidsPending || attributionIds.length > 0
    : !isEmptySelection;

  // The two queries resolve the same result set; only once both have settled
  // can they disagree, and without the UUIDs the tree would silently
  // disappear, so surface the inconsistency.
  const hasSelectionSizeDrift =
    limitExceeded &&
    !selectionSummaryQuery.isFetching &&
    !attributionUuidsQuery.isFetching &&
    summary !== undefined &&
    summary.selectedCount <= QUERY_WIDE_TREE_LIMIT;
  useEffect(() => {
    if (hasSelectionSizeDrift) {
      console.error(
        'The summary count and the UUID resolution of a query-wide selection disagree on its size; hiding the linked resources tree.',
        {
          summarySelectedCount: summary?.selectedCount,
          uuidResolutionLimitExceeded: limitExceeded,
        },
      );
    }
  }, [hasSelectionSizeDrift, summary, limitExceeded]);
  useEffect(() => {
    if (attributionUuidsQuery.isError) {
      console.error(
        'Failed to resolve the UUIDs of the query-wide selection; hiding the linked resources tree.',
        attributionUuidsQuery.error,
      );
    }
  }, [attributionUuidsQuery.isError, attributionUuidsQuery.error]);

  const attributions: typeof fetchedAttributions = isEmptySelection
    ? {}
    : fetchedAttributions;
  const attributionValues = attributions && Object.values(attributions);

  return {
    selectedResourceId,
    attributions,
    attributionIds,
    isQueryWideSelection,
    canShowLinkedResourcesTree,
    isSelectionDataReady:
      (isQueryWideSelection
        ? selectionSummaryQuery.isSuccess
        : isEmptySelection || areAttributionsReady) &&
      areAttributionUuidsResolved,
    selectionMetadata: {
      selectedAttributionCount: isQueryWideSelection
        ? (summary?.selectedCount ?? 0)
        : explicitAttributionUuids.length,
      mixedAttributionCount: isQueryWideSelection
        ? (summary?.mixedCount ?? 0)
        : (attributionValues?.filter(
            (attribution) => attribution.resourceAccess === 'mixed',
          ).length ?? 0),
      areAllAttributionsPreselected: isQueryWideSelection
        ? summary
          ? summary.preSelectedCount === summary.selectedCount
          : undefined
        : attributionValues?.every((attribution) => attribution.preSelected),
      allLinkedToSelectedResource: isQueryWideSelection
        ? summary?.allLinkedToSelectedResource
        : attributionValues?.every(
            (attribution) => attribution.relation === 'resource',
          ),
      writableLinkedResourceCount: isQueryWideSelection
        ? summary?.writableLinkedResourceCount
        : undefined,
    },
  };
}
