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
 * Bound on the number of attribution UUIDs the backend materializes for a
 * query-wide selection to render the linked resources tree. The attribution
 * count is not a rendering-cost driver (that is the number of writable
 * linked resources, see {@link QUERY_WIDE_TREE_LINK_LIMIT}), but it bounds
 * the materialized UUID set, which the link count alone does not: a
 * selection can comprise many attributions with few writable links. The
 * resolution reports `limitExceeded` beyond the bound without materializing
 * an arbitrary number of UUIDs, and the popups then hide the tree and fall
 * back to the summary counts.
 */
const QUERY_WIDE_TREE_ATTRIBUTION_LIMIT = 100;

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
  const selectionCount = summary?.selectedCount;
  const attributionUuidsQuery = backend.getAttributionSelectionUuids.useQuery(
    open && !isMutationPending && queryWideSelection
      ? {
          selection: queryWideSelection,
          limit: QUERY_WIDE_TREE_ATTRIBUTION_LIMIT,
        }
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
    ? areAttributionUuidsPending ||
      (!!selectionCount &&
        (summary?.writableLinkedResourceCount ?? 0) <=
          QUERY_WIDE_TREE_LINK_LIMIT &&
        !limitExceeded)
    : !isEmptySelection;

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
