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
 * Largest query-wide selection for which the backend materializes the
 * attribution UUIDs needed to render the linked resources tree. Larger
 * selections keep the tree hidden and fall back to the summary counts.
 *
 * The cost of the tree pipeline is dominated by the number of writable
 * linked resources, not by the attribution count (a single attribution can
 * carry hundreds of thousands of links), so this is only a cheap secondary
 * heuristic that primarily bounds the materialized UUID set. The primary
 * gate is {@link QUERY_WIDE_TREE_LINK_LIMIT}.
 */
const QUERY_WIDE_TREE_LIMIT = 100;

/**
 * Largest number of writable linked resources for which the confirmation
 * popup renders the linked resources tree. The work behind the tree scales
 * with linked resources (materializing their paths and expanding their
 * ancestor chains), not with the number of selected attributions: on the
 * large performance profile, a selection of well under 100 attributions
 * covering ~1M links took 5-10s (~5-10µs per linked resource), while
 * selections of up to 100 attributions on typical files resolve in ~50ms.
 * 10,000 resources therefore keeps even adversarial link distributions
 * within the ~50-100ms responsiveness envelope, and selections beyond it
 * fall back to the summary's writableLinkedResourceCount, which the same
 * fast aggregate that feeds this gate computes anyway.
 */
const QUERY_WIDE_TREE_LINK_LIMIT = 10_000;

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
  const selectionCount = summary?.selectedCount;
  const areCountsPending = isQueryWideSelection && selectionCount === undefined;
  const canShowLinkedResourcesTree = isQueryWideSelection
    ? areCountsPending ||
      (!!selectionCount &&
        selectionCount <= QUERY_WIDE_TREE_LIMIT &&
        (summary?.writableLinkedResourceCount ?? 0) <=
          QUERY_WIDE_TREE_LINK_LIMIT)
    : !isEmptySelection;

  const attributions: typeof fetchedAttributions = isEmptySelection
    ? {}
    : fetchedAttributions;
  const attributionValues = attributions && Object.values(attributions);

  const treeSelection: AttributionSelection = isQueryWideSelection
    ? selection
    : { mode: 'explicit', attributionUuids: explicitAttributionUuids };

  return {
    selectedResourceId,
    attributions,
    treeSelection,
    treeAttributionLimit: isQueryWideSelection
      ? QUERY_WIDE_TREE_LIMIT
      : undefined,
    isQueryWideSelection,
    canShowLinkedResourcesTree,
    isSelectionDataReady: isQueryWideSelection
      ? selectionSummaryQuery.isSuccess
      : isEmptySelection || areAttributionsReady,
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
