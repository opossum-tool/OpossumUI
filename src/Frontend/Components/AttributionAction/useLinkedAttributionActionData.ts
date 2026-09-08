// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import type { Attributions } from '../../../shared/shared-types';
import { useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { useIsSelectedResourceReadonly } from '../../util/use-selected-resource';
import { useLinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';

type AttributionSelectionSummary = Awaited<
  ReturnType<typeof backend.getAttributionSelectionSummary.query>
>;

type AttributionActionSummary = {
  selectedAttributionCount: number;
  linkedResourceCount: number | undefined;
  mixedAttributionCount: number;
  areAllAttributionsPreselected: boolean | undefined;
  isResourceInfoReady: boolean;
  isLocalActionAvailable: boolean;
};

export function useLinkedAttributionActionData({
  open,
  isMutationPending = false,
  selection,
}: {
  open: boolean;
  isMutationPending?: boolean;
  selection: AttributionSelection;
}) {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const attributionIds =
    selection.mode === 'explicit' ? selection.attributionUuids : [];
  const isQueryWideSelection = selection.mode === 'allMatching';

  const { data: attributions, isSuccess: areAttributionsReady } =
    backend.getAttributions.useQuery(
      open && !isMutationPending && !isQueryWideSelection
        ? {
            attributionUuids: attributionIds,
            resourcePathForRelationships: selectedResourceId,
          }
        : skipToken,
    );

  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    { selection },
    { enabled: open && isQueryWideSelection },
  );

  const linkedResourcesTreeState = useLinkedResourcesTreeState({
    onAttributionUuids: attributionIds,
    enabled:
      open &&
      !isMutationPending &&
      areAttributionsReady &&
      !isQueryWideSelection,
    onlyWritable: true,
  });

  const actionSummary = isQueryWideSelection
    ? getQueryWideActionSummary({
        selectionSummary: selectionSummaryQuery.data,
        isResourceInfoReady: selectionSummaryQuery.isSuccess,
        isSelectedResourceReadonly,
      })
    : getExplicitActionSummary({
        attributionIds,
        attributions,
        linkedResourceCount: linkedResourcesTreeState?.count,
        isResourceInfoReady: areAttributionsReady,
        isSelectedResourceReadonly,
      });

  return {
    selectedResourceId,
    attributions,
    linkedResourcesTreeState,
    actionSummary,
  };
}

function getExplicitActionSummary({
  attributionIds,
  attributions,
  linkedResourceCount,
  isResourceInfoReady,
  isSelectedResourceReadonly,
}: {
  attributionIds: Array<string>;
  attributions: Attributions | undefined;
  linkedResourceCount: number | undefined;
  isResourceInfoReady: boolean;
  isSelectedResourceReadonly: boolean;
}): AttributionActionSummary {
  const attributionValues = attributions && Object.values(attributions);
  const isResourceLinkedOnAllAttributions = attributionValues?.every(
    (attribution) => attribution.relation === 'resource',
  );

  return {
    selectedAttributionCount: attributionIds.length,
    linkedResourceCount,
    mixedAttributionCount:
      attributionValues?.filter(
        (attribution) => attribution.resourceAccess === 'mixed',
      ).length ?? 0,
    areAllAttributionsPreselected: attributionValues?.every(
      (attribution) => attribution.preSelected,
    ),
    isResourceInfoReady,
    isLocalActionAvailable: getIsLocalActionAvailable(
      linkedResourceCount,
      isResourceLinkedOnAllAttributions,
      isSelectedResourceReadonly,
    ),
  };
}

function getQueryWideActionSummary({
  selectionSummary,
  isResourceInfoReady,
  isSelectedResourceReadonly,
}: {
  selectionSummary: AttributionSelectionSummary | undefined;
  isResourceInfoReady: boolean;
  isSelectedResourceReadonly: boolean;
}): AttributionActionSummary {
  const linkedResourceCount = selectionSummary?.writableLinkedResourceCount;

  return {
    selectedAttributionCount: selectionSummary?.selectedCount ?? 0,
    linkedResourceCount,
    mixedAttributionCount: selectionSummary?.mixedCount ?? 0,
    areAllAttributionsPreselected: selectionSummary
      ? selectionSummary.preSelectedCount === selectionSummary.selectedCount
      : undefined,
    isResourceInfoReady,
    isLocalActionAvailable: getIsLocalActionAvailable(
      linkedResourceCount,
      selectionSummary?.allLinkedToSelectedResource,
      isSelectedResourceReadonly,
    ),
  };
}

function getIsLocalActionAvailable(
  linkedResourceCount: number | undefined,
  isResourceLinkedOnAllAttributions: boolean | undefined,
  isSelectedResourceReadonly: boolean,
) {
  return Boolean(
    linkedResourceCount &&
    linkedResourceCount > 1 &&
    isResourceLinkedOnAllAttributions &&
    !isSelectedResourceReadonly,
  );
}
