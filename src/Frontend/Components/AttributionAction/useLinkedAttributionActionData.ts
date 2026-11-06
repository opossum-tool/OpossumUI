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
    isQueryWideSelection,
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
      !isQueryWideSelection,
    onlyWritable: true,
  });
  const linkedResourceCount = isQueryWideSelection
    ? selectionMetadata.writableLinkedResourceCount
    : linkedResourcesTreeState?.count;
  const actionSummary = {
    selectedAttributionCount: selectionMetadata.selectedAttributionCount,
    mixedAttributionCount: selectionMetadata.mixedAttributionCount,
    areAllAttributionsPreselected:
      selectionMetadata.areAllAttributionsPreselected,
    linkedResourceCount,
    isResourceInfoReady:
      isSelectionDataReady &&
      (isQueryWideSelection ||
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
