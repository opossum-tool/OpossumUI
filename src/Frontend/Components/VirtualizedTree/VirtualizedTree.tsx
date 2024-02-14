// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { useMemo } from 'react';

import { TREE_ROOT_FOLDER_LABEL } from '../../shared-styles';
import { getResourcesFromIds } from '../../state/helpers/resources-helpers';
import { useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/resource-selectors';
import { List } from '../List/List';
import { getTreeNodes } from './VirtualizedTree.util';
import {
  TreeNode,
  VirtualizedTreeNode,
} from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps {
  TreeNodeLabel: React.FC<TreeNode>;
  expandedIds: Array<string>;
  resourceIds: Array<string>;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  readOnly?: boolean;
  selectedNodeId?: string;
  sx?: SxProps;
  testId?: string;
}

export function VirtualizedTree({
  TreeNodeLabel,
  expandedIds,
  onSelect,
  onToggle,
  readOnly,
  resourceIds,
  selectedNodeId,
  sx,
  testId,
}: VirtualizedTreeProps) {
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const resources = useMemo(
    () => getResourcesFromIds(resourceIds),
    [resourceIds],
  );
  const treeNodes = useMemo(
    () =>
      getTreeNodes(
        { [TREE_ROOT_FOLDER_LABEL]: resources },
        expandedIds,
        filesWithChildren,
      ),
    [expandedIds, filesWithChildren, resources],
  );

  return (
    <List
      data={resourceIds.length ? Object.keys(treeNodes) : []}
      renderItemContent={(nodeId) => (
        <VirtualizedTreeNode
          TreeNodeLabel={TreeNodeLabel}
          isExpandedNode={expandedIds.includes(nodeId)}
          onToggle={onToggle}
          onSelect={onSelect}
          readOnly={readOnly}
          selected={nodeId === selectedNodeId}
          {...treeNodes[nodeId]}
        />
      )}
      selected={selectedNodeId}
      testId={testId}
      sx={{
        height: '100%',
        // allow tree node selected indicator to overflow the width of the list
        '& [data-viewport-type]': {
          width: 'unset !important',
          minWidth: '100%',
        },
        ...sx,
      }}
    />
  );
}
