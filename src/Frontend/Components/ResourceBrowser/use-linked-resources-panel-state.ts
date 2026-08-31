// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { useAppSelector } from '../../state/hooks';
import {
  getAttributionSelectionPendingResourceId,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { useSelectedAttribution } from '../../util/use-selected-attribution';
import {
  type LinkedResourcesTreeState,
  useLinkedResourcesTree,
} from './LinkedResourcesTree/useLinkedResourcesTreeState';

export type LinkedResourcesPanelState = {
  isHidden: boolean;
  isLoading: boolean;
  treeState: LinkedResourcesTreeState | undefined;
};

type GetLinkedResourcesPanelStateParams = {
  attributionDetailsReady: boolean;
  hasSelectedAttribution: boolean;
  isError: boolean;
  isLoading: boolean;
  treeState: LinkedResourcesTreeState | undefined;
};

export function getLinkedResourcesPanelState({
  attributionDetailsReady,
  hasSelectedAttribution,
  isError,
  isLoading,
  treeState,
}: GetLinkedResourcesPanelStateParams): LinkedResourcesPanelState {
  return {
    isHidden: !hasSelectedAttribution || (isError && !treeState),
    isLoading:
      hasSelectedAttribution &&
      !isError &&
      (!attributionDetailsReady || isLoading || !treeState),
    treeState,
  };
}

export function useLinkedResourcesPanelState({
  search,
}: {
  search?: string;
} = {}): LinkedResourcesPanelState {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionSelectionPendingResourceId = useAppSelector(
    getAttributionSelectionPendingResourceId,
  );
  const {
    isError: isAttributionError,
    isPending: isAttributionPending,
    packageInfo: selectedAttribution,
  } = useSelectedAttribution();
  const onAttributionUuids = useMemo(
    () => [selectedAttributionId],
    [selectedAttributionId],
  );
  const attributionDetailsReady =
    !selectedAttributionId ||
    (attributionSelectionPendingResourceId !== selectedResourceId &&
      !isAttributionPending &&
      !isAttributionError &&
      selectedAttribution?.id === selectedAttributionId);
  const linkedResourcesTreeQuery = useLinkedResourcesTree({
    enabled: attributionDetailsReady,
    onAttributionUuids,
    search,
  });

  return getLinkedResourcesPanelState({
    attributionDetailsReady,
    hasSelectedAttribution: !!selectedAttributionId,
    isError: isAttributionError || linkedResourcesTreeQuery.isError,
    isLoading: linkedResourcesTreeQuery.isLoading,
    treeState: linkedResourcesTreeQuery.data,
  });
}
