// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionSelection } from '../../../shared/attribution-selection';
import { useIsSelectedResourceReadonly } from '../../util/use-selected-resource';
import { useLinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';
import { useAttributionSelectionData } from './use-attribution-selection-data';

export function useLinkedAttributionActionData({
  open,
  isMutationPending = false,
  selection,
}: {
  open: boolean;
  isMutationPending?: boolean;
  selection: AttributionSelection;
}) {
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const {
    selectedResourceId,
    attributions,
    attributionIds,
    canShowLinkedResourcesTree,
    isSelectionDataReady,
    selectionMetadata,
  } = useAttributionSelectionData({ open, isMutationPending, selection });
  const {
    data: linkedResourcesTreeState,
    isError: hasLinkedResourcesTreeError,
    isLoading: isLinkedResourcesTreeLoading,
  } = useLinkedResourcesTree({
    onAttributionUuids: attributionIds,
    enabled:
      open &&
      !isMutationPending &&
      isSelectionDataReady &&
      canShowLinkedResourcesTree,
    onlyWritable: true,
  });
  // While the tree will be rendered, its count is authoritative and the
  // description stays without a number until it arrives (the popup actions
  // are disabled while the resource info is not ready). The summary count
  // only serves as a fallback when the tree is hidden or failed to load,
  // and always measures the same linked resources the tree would show.
  const linkedResourceCount = canShowLinkedResourcesTree
    ? linkedResourcesTreeState?.count
    : selectionMetadata.writableLinkedResourceCount;
  const actionSummary = {
    selectedAttributionCount: selectionMetadata.selectedAttributionCount,
    mixedAttributionCount: selectionMetadata.mixedAttributionCount,
    areAllAttributionsPreselected:
      selectionMetadata.areAllAttributionsPreselected,
    linkedResourceCount,
    isResourceInfoReady:
      isSelectionDataReady &&
      (!canShowLinkedResourcesTree ||
        (!isLinkedResourcesTreeLoading && !hasLinkedResourcesTreeError)),
    isLocalActionAvailable: Boolean(
      linkedResourceCount &&
      linkedResourceCount > 1 &&
      selectionMetadata.allLinkedToSelectedResource &&
      !isSelectedResourceReadonly,
    ),
  };

  return {
    selectedResourceId,
    attributions,
    linkedResourcesTreeState,
    actionSummary,
  };
}
