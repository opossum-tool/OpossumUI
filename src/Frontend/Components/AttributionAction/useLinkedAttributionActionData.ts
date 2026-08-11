// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';

import { useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { useIsSelectedResourceReadonly } from '../../util/use-selected-resource';
import { useLinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';

export function useLinkedAttributionActionData({
  attributionIds,
  open,
  isMutationPending = false,
  skipWithoutSelectedResource = false,
}: {
  attributionIds: Array<string>;
  open: boolean;
  isMutationPending?: boolean;
  skipWithoutSelectedResource?: boolean;
}) {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();

  const { data: attributions } = backend.listAttributions.useQuery(
    open &&
      !isMutationPending &&
      (!skipWithoutSelectedResource || !!selectedResourceId)
      ? {
          resourcePathForRelationships: selectedResourceId,
          uuids: attributionIds,
        }
      : skipToken,
  );

  const resourceInfoQuery = backend.getResourceInfoOnAttributions.useQuery(
    open ? { attributionUuids: attributionIds } : skipToken,
  );
  const { data: resourceInfoOnAttributions } = resourceInfoQuery;

  const linkedResourcesTreeState = useLinkedResourcesTreeState({
    onAttributionUuids: attributionIds,
    enabled: open,
    onlyWritable: true,
  });

  const linkedResourceCount = linkedResourcesTreeState?.count;
  const mixedAttributionCount = resourceInfoOnAttributions
    ? Object.values(resourceInfoOnAttributions).filter((info) => info.isMixed)
        .length
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
    isResourceInfoReady: resourceInfoQuery.isSuccess,
    isLocalActionAvailable,
    selectedResourceId,
  };
}
