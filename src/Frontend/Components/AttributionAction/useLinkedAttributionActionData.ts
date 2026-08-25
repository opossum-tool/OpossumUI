// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import { useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { useIsSelectedResourceReadonly } from '../../util/use-selected-resource';
import { useLinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';

export function useLinkedAttributionActionData({
  attributionIds,
  open,
  isMutationPending = false,
  selection,
}: {
  attributionIds: Array<string>;
  open: boolean;
  isMutationPending?: boolean;
  selection?: AttributionSelection;
}) {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const isQueryWideSelection = selection?.mode === 'allMatching';

  const { data: attributions, isSuccess: areAttributionsReady } =
    backend.listAttributions.useQuery(
      open && !isMutationPending && !isQueryWideSelection
        ? {
            resourcePathForRelationships: selectedResourceId,
            uuids: attributionIds,
          }
        : skipToken,
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

  const linkedResourceCount = linkedResourcesTreeState?.count;
  const mixedAttributionCount = attributions
    ? Object.values(attributions).filter(
        (attribution) => attribution.resourceAccess === 'mixed',
      ).length
    : 0;
  const isResourceLinkedOnAllAttributions = attributions
    ? Object.values(attributions).every(
        (attribution) => attribution.relation === 'resource',
      )
    : undefined;
  const isLocalActionAvailable = Boolean(
    linkedResourceCount &&
    linkedResourceCount > 1 &&
    isResourceLinkedOnAllAttributions &&
    !isSelectedResourceReadonly,
  );

  return {
    attributions,
    linkedResourceCount,
    linkedResourcesTreeState,
    mixedAttributionCount,
    isResourceInfoReady: isQueryWideSelection || areAttributionsReady,
    isLocalActionAvailable,
    isSelectedResourceReadonly,
    selectedResourceId,
  };
}
