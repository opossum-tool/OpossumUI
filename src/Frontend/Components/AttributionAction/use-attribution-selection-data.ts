// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import { useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';

/**
 * Largest query-wide selection for which the attribution UUIDs are
 * materialized so the linked resources tree can be rendered in confirmation
 * popups. Larger (symbolic) select-all selections keep hiding the tree.
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
  const isQueryWideSelection = selection.mode === 'allMatching';
  const isEmptySelection =
    !isQueryWideSelection && selection.attributionUuids.length === 0;

  const { data: fetchedAttributions, isSuccess: areAttributionsReady } =
    backend.getAttributionPreview.useQuery(
      open && !isMutationPending && !isQueryWideSelection && !isEmptySelection
        ? {
            attributionUuids: selection.attributionUuids,
            resourcePathForRelationships: selectedResourceId,
          }
        : skipToken,
    );

  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    { selection },
    { enabled: open && !isMutationPending && isQueryWideSelection },
  );
  const summary = selectionSummaryQuery.data;
  // Rendering the linked resources tree requires the attribution UUIDs. They
  // are only materialized for query-wide selections small enough to be
  // resolved as a whole.
  const canShowLinkedResourcesTree = isQueryWideSelection
    ? summary !== undefined && summary.selectedCount <= QUERY_WIDE_TREE_LIMIT
    : !isEmptySelection;
  const attributionUuidsQuery = backend.getAttributionSelectionUuids.useQuery(
    open &&
      !isMutationPending &&
      isQueryWideSelection &&
      summary !== undefined &&
      summary.selectedCount <= QUERY_WIDE_TREE_LIMIT
      ? { selection, limit: QUERY_WIDE_TREE_LIMIT }
      : skipToken,
  );
  const resolvedAttributionUuids =
    attributionUuidsQuery.data && !attributionUuidsQuery.data.limitExceeded
      ? attributionUuidsQuery.data.attributionUuids
      : [];
  const attributionIds = isQueryWideSelection
    ? resolvedAttributionUuids
    : selection.attributionUuids;

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
    isSelectionDataReady: isQueryWideSelection
      ? selectionSummaryQuery.isSuccess
      : isEmptySelection || areAttributionsReady,
    selectionMetadata: {
      selectedAttributionCount: isQueryWideSelection
        ? (summary?.selectedCount ?? 0)
        : selection.attributionUuids.length,
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
