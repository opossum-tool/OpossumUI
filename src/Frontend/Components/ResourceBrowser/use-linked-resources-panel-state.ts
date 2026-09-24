// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState } from 'react';

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
  isIndicatorVisible: boolean;
  isSearchApplied: boolean;
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
    isSearchApplied:
      hasSelectedAttribution &&
      attributionDetailsReady &&
      !isError &&
      !isLoading &&
      !!treeState,
    isLoading:
      hasSelectedAttribution &&
      !isError &&
      (!attributionDetailsReady || isLoading || !treeState),
    isIndicatorVisible: false,
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
  const [completed, setCompleted] = useState<{
    attributionId: string;
    treeState: LinkedResourcesTreeState;
  }>();
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);
  const currentTreeState = linkedResourcesTreeQuery.data;
  const currentSelectionReady =
    attributionDetailsReady && !!selectedAttributionId;
  const isCurrentResultComplete =
    currentSelectionReady &&
    !linkedResourcesTreeQuery.isLoading &&
    !isAttributionError &&
    !linkedResourcesTreeQuery.isError &&
    !!currentTreeState;

  useEffect(() => {
    if (!selectedAttributionId) {
      setCompleted(undefined);
      return;
    }
    if (
      (isAttributionError || linkedResourcesTreeQuery.isError) &&
      completed?.attributionId !== selectedAttributionId
    ) {
      setCompleted(undefined);
      return;
    }
    if (isCurrentResultComplete && currentTreeState) {
      setCompleted({
        attributionId: selectedAttributionId,
        treeState: currentTreeState,
      });
    }
  }, [
    completed?.attributionId,
    currentTreeState,
    isAttributionError,
    isCurrentResultComplete,
    linkedResourcesTreeQuery.isError,
    selectedAttributionId,
  ]);

  const panelLoading =
    !!selectedAttributionId &&
    !isAttributionError &&
    !linkedResourcesTreeQuery.isError &&
    (!attributionDetailsReady ||
      linkedResourcesTreeQuery.isLoading ||
      !isCurrentResultComplete);
  const retained =
    completed?.attributionId === selectedAttributionId || panelLoading
      ? completed?.treeState
      : undefined;
  const panelState = getLinkedResourcesPanelState({
    attributionDetailsReady,
    hasSelectedAttribution: !!selectedAttributionId,
    isError: isAttributionError || linkedResourcesTreeQuery.isError,
    isLoading: linkedResourcesTreeQuery.isLoading || !attributionDetailsReady,
    treeState: isCurrentResultComplete ? currentTreeState : retained,
  });
  useEffect(() => setIsIndicatorVisible(panelLoading), [panelLoading]);
  return {
    ...panelState,
    isHidden: panelState.isHidden,
    isLoading: panelLoading,
    isIndicatorVisible: panelLoading && isIndicatorVisible,
  };
}
