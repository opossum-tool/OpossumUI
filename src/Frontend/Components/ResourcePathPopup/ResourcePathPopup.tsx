// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  getExternalAttributionsToResources,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { useWindowHeight } from '../../util/use-window-height';
import {
  getInitialExpandedIds,
  getResourcesFromResourcePaths,
} from './resource-path-popup-helpers';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { ButtonText } from '../../enums/enums';
import MuiBox from '@mui/material/Box';
import { VirtualizedTree } from '../../extracted/VirtualisedTree/VirtualizedTree';
import { treeClasses } from '../../shared-styles';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
} from '../../state/selectors/all-views-resource-selectors';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { getTreeItemLabel } from '../ResourceBrowser/get-tree-item-label';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { Resources } from '../../../shared/shared-types';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { remove } from 'lodash';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { EMPTY_ATTRIBUTION_DATA } from '../../shared-constants';

const ROOT_FOLDER_LABEL = '';
const TREE_ROW_HEIGHT = 20;
const VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES = 236;
const HORIZONTAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES = 112;
const POPUP_CONTENT_PADDING = 48;

interface ResourcePathPopupProps {
  closePopup(): void;
  attributionId: string;
  isExternalAttribution: boolean;
  displayedAttributionName: string;
}

export function ResourcePathPopup(props: ResourcePathPopupProps): ReactElement {
  const externalAttributionsToResources = useAppSelector(
    getExternalAttributionsToResources
  );
  const manualAttributionsToResources = useAppSelector(
    getManualAttributionsToResources
  );
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

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
        {},
        {},
        {},
        {},
        {},
        new Set<string>(),
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren),
        EMPTY_ATTRIBUTION_DATA
      );
  }

  const allResourceIds = props.isExternalAttribution
    ? externalAttributionsToResources[props.attributionId]
    : manualAttributionsToResources[props.attributionId];

  const initialExpandedIds = getInitialExpandedIds(allResourceIds);

  const [expandedIds, setExpandedIds] = useState<string[]>(initialExpandedIds);

  function handleToggle(nodeIdsToExpand: Array<string>): void {
    let newExpandedNodeIds = [...expandedIds];
    if (expandedIds.includes(nodeIdsToExpand[0])) {
      remove(newExpandedNodeIds, (nodeId: string): boolean =>
        nodeId.startsWith(nodeIdsToExpand[0])
      );
    } else {
      newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
    }
    setExpandedIds(newExpandedNodeIds);
  }

  const dispatch = useAppDispatch();

  function handleSelect(
    event: React.ChangeEvent<unknown>,
    nodeId: string
  ): void {
    dispatch(navigateToSelectedPathOrOpenUnsavedPopup(nodeId));
  }

  const maxTreeHeight: number =
    useWindowHeight() - VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES;
  const header = `Resources for selected ${
    props.isExternalAttribution ? 'signal' : 'attribution'
  }`;
  const resources = getResourcesFromResourcePaths(allResourceIds);

  return (
    <NotificationPopup
      header={header}
      headerSx={treeClasses.header(POPUP_CONTENT_PADDING)}
      rightButtonConfig={{
        onClick: props.closePopup,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={props.closePopup}
      onEscapeKeyDown={props.closePopup}
      content={
        <MuiBox
          sx={treeClasses.treeContainer(
            VERTICAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES
          )}
        >
          <VirtualizedTree
            expandedIds={expandedIds}
            isFakeNonExpandableNode={getFileWithChildrenCheck(
              filesWithChildren
            )}
            onSelect={handleSelect}
            onToggle={handleToggle}
            nodes={{ [ROOT_FOLDER_LABEL]: resources }}
            selectedNodeId={selectedResourceId}
            ariaLabel={'resource browser'}
            getTreeNodeLabel={getTreeItemLabelGetter()}
            cardHeight={TREE_ROW_HEIGHT}
            maxHeight={maxTreeHeight}
            sx={treeClasses.tree(
              'popup',
              HORIZONTAL_SPACE_BETWEEN_TREE_AND_VIEWPORT_EDGES,
              POPUP_CONTENT_PADDING
            )}
            alwaysShowHorizontalScrollBar={true}
            treeNodeStyle={{
              root: treeClasses.treeItemLabel,
              childrenOfSelected: treeClasses.treeItemLabelChildrenOfSelected,
              selected: treeClasses.treeItemLabelSelected,
              treeExpandIcon: treeClasses.treeExpandIcon,
            }}
          />
        </MuiBox>
      }
      isOpen={true}
      fullWidth={false}
    />
  );
}
