// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import remove from 'lodash/remove';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalAttributions,
  getFilesWithChildren,
  getManualAttributions,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
} from '../../state/selectors/all-views-resource-selectors';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setExpandedIds } from '../../state/actions/resource-actions/audit-view-simple-actions';
import {
  getExpandedIds,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { VirtualizedTree } from '../VirtualisedTree/VirtualizedTree';

export function ResourceBrowser(): ReactElement | null {
  const resources = useAppSelector(getResources);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);

  const manualAttributions = useAppSelector(getManualAttributions);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions
  );
  const resourcesWithManualAttributedChildren = useAppSelector(
    getResourcesWithManualAttributedChildren
  );

  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions
  );
  const resourcesWithExternalAttributedChildren = useAppSelector(
    getResourcesWithExternalAttributedChildren
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions
  );

  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  const dispatch = useAppDispatch();

  function handleToggle(nodeIdsToExpand: Array<string>): void {
    let newExpandedNodeIds = [...expandedIds];
    if (expandedIds.includes(nodeIdsToExpand[0])) {
      remove(newExpandedNodeIds, (nodeId: string): boolean =>
        nodeId.startsWith(nodeIdsToExpand[0])
      );
    } else {
      newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
    }
    dispatch(setExpandedIds(newExpandedNodeIds));
  }

  function handleSelect(
    event: React.ChangeEvent<unknown>,
    nodeId: string
  ): void {
    dispatch(setSelectedResourceIdOrOpenUnsavedPopup(nodeId));
  }

  return (
    <VirtualizedTree
      expandedIds={expandedIds}
      externalAttributions={externalAttributions}
      isAttributionBreakpoint={getAttributionBreakpointCheck(
        attributionBreakpoints
      )}
      isFileWithChildren={getFileWithChildrenCheck(filesWithChildren)}
      manualAttributions={manualAttributions}
      onSelect={handleSelect}
      onToggle={handleToggle}
      resolvedExternalAttributions={resolvedExternalAttributions}
      resources={resources}
      resourcesToExternalAttributions={resourcesToExternalAttributions}
      resourcesToManualAttributions={resourcesToManualAttributions}
      resourcesWithExternalAttributedChildren={
        resourcesWithExternalAttributedChildren
      }
      resourcesWithManualAttributedChildren={
        resourcesWithManualAttributedChildren
      }
      selectedResourceId={selectedResourceId}
    />
  );
}
