// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { remove } from 'lodash';
import { ReactElement, useMemo, useState } from 'react';

import { Resources } from '../../../shared/shared-types';
import { VirtualizedTree } from '../../extracted/VirtualisedTree/VirtualizedTree';
import {
  TREE_ROOT_FOLDER_LABEL,
  TREE_ROW_HEIGHT,
  treeClasses,
} from '../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { getGeneralTreeItemLabel } from './get-general-tree-item-label';
import {
  getInitialExpandedIds,
  getResourcesFromResourcePaths,
} from './resources-tree-helpers';

interface ResourcesTreeProps {
  resourcePaths: Array<string>;
  highlightSelectedResources: boolean;
  onSelect?: (resourceId: string) => void;
  sx?: SxProps;
}

export function ResourcesTree(props: ResourcesTreeProps): ReactElement {
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const dispatch = useAppDispatch();
  const resources = getResourcesFromResourcePaths(props.resourcePaths);
  const [expandedIds, setExpandedIds] = useState<Array<string>>([]);
  const highlightedResourceId = props.highlightSelectedResources
    ? selectedResourceId
    : '';

  useMemo(() => {
    setExpandedIds(getInitialExpandedIds(props.resourcePaths));
  }, [props.resourcePaths]);

  function handleToggle(nodeIdsToExpand: Array<string>): void {
    let newExpandedNodeIds = [...expandedIds];
    if (expandedIds.includes(nodeIdsToExpand[0])) {
      remove(newExpandedNodeIds, (nodeId: string): boolean =>
        nodeId.startsWith(nodeIdsToExpand[0]),
      );
    } else {
      newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
    }
    setExpandedIds(newExpandedNodeIds);
  }

  function handleSelect(_: React.ChangeEvent<unknown>, nodeId: string): void {
    dispatch(navigateToSelectedPathOrOpenUnsavedPopup(nodeId));
    props.onSelect?.(nodeId);
  }

  function getTreeItemLabelGetter() {
    return (
      resourceName: string,
      resource: Resources | 1,
      nodeId: string,
    ): ReactElement =>
      getGeneralTreeItemLabel(
        resourceName,
        resource,
        nodeId,
        getAttributionBreakpointCheck(attributionBreakpoints),
        getFileWithChildrenCheck(filesWithChildren),
      );
  }

  return (
    <VirtualizedTree
      expandedIds={expandedIds}
      isFakeNonExpandableNode={getFileWithChildrenCheck(filesWithChildren)}
      onSelect={handleSelect}
      onToggle={handleToggle}
      nodes={{ [TREE_ROOT_FOLDER_LABEL]: resources }}
      selectedNodeId={highlightedResourceId}
      getTreeNodeLabel={getTreeItemLabelGetter()}
      cardHeight={TREE_ROW_HEIGHT}
      sx={props.sx}
      treeNodeStyle={{
        root: treeClasses.treeItemLabel,
        childrenOfSelected: treeClasses.treeItemLabelChildrenOfSelected,
        selected: treeClasses.treeItemLabelSelected,
        treeExpandIcon: treeClasses.treeExpandIcon,
      }}
    />
  );
}
