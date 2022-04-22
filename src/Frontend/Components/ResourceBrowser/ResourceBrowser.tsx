// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import remove from 'lodash/remove';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
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
import { VirtualizedTree } from '../../extracted/VirtualisedTree/VirtualizedTree';
import { Resources } from '../../../shared/shared-types';
import { getTreeItemLabel } from './get-tree-item-label';
import { useWindowHeight } from '../../util/use-window-height';
import { topBarHeight } from '../TopBar/TopBar';
import {
  OpossumColors,
  resourceBrowserWidthInPixels,
} from '../../shared-styles';

const classes = {
  tree: {
    width: resourceBrowserWidthInPixels,
    padding: '4px 0',
    background: OpossumColors.white,
    height: '100%',
  },
  treeItemLabel: {
    height: '19px',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover}`,
      cursor: 'pointer',
    },
  },
  treeItemLabelChildrenOfSelected: {
    backgroundColor: `${OpossumColors.lightestBlue}`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
  },
  treeItemLabelSelected: {
    backgroundColor: `${OpossumColors.lightestBlue} !important`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover} !important`,
    },
  },
  treeExpandIcon: {
    width: '16px',
    height: '20px',
    padding: '0px',
    margin: '0px',
    color: OpossumColors.darkBlue,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
};

const TREE_ROW_HEIGHT = 20;
const ROOT_FOLDER_LABEL = '';

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

  function getTreeItemLabelGetter() {
    return (
      resourceName: string,
      resource: Resources | 1,
      nodeId: string
    ): ReactElement =>
      getTreeItemLabel(
        resourceName,
        resource,
        nodeId,
        resourcesToManualAttributions,
        resourcesToExternalAttributions,
        manualAttributions,
        resourcesWithExternalAttributedChildren,
        resourcesWithManualAttributedChildren,
        resolvedExternalAttributions,
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren)
      );
  }

  const maxTreeHeight: number = useWindowHeight() - topBarHeight - 4;

  return resources ? (
    <VirtualizedTree
      expandedIds={expandedIds}
      isFakeNonExpandableNode={getFileWithChildrenCheck(filesWithChildren)}
      onSelect={handleSelect}
      onToggle={handleToggle}
      nodes={{ [ROOT_FOLDER_LABEL]: resources }}
      selectedNodeId={selectedResourceId}
      ariaLabel={'resource browser'}
      getTreeNodeLabel={getTreeItemLabelGetter()}
      cardHeight={TREE_ROW_HEIGHT}
      maxHeight={maxTreeHeight}
      sx={classes.tree}
      alwaysShowHorizontalScrollBar={true}
      treeNodeStyle={{
        root: classes.treeItemLabel,
        childrenOfSelected: classes.treeItemLabelChildrenOfSelected,
        selected: classes.treeItemLabelSelected,
        treeExpandIcon: classes.treeExpandIcon,
      }}
    />
  ) : null;
}
