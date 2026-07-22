// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/system';
import type { MouseEvent } from 'react';

import type { QueryResult } from '../../../ElectronBackend/api/queries';
import type { ResourceTreeNodeData } from '../../../ElectronBackend/api/resourceTree';
import { List } from '../List/List';
import { SearchList } from '../SearchList/SearchList';
import {
  type TreeNode,
  VirtualizedTreeNode,
} from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps {
  TreeNodeLabel: React.FC<TreeNode>;
  resources: QueryResult<'getResourceTree'>['treeNodes'];
  onSelect: (nodeId: string) => void;
  onContextMenu?: (
    event: MouseEvent<HTMLElement>,
    resource: ResourceTreeNodeData,
  ) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  contextMenuNodeId?: string;
  readOnly?: boolean;
  selectedNodeId?: string;
  sx?: SxProps;
  testId?: string;
}

export function VirtualizedTree({
  TreeNodeLabel,
  onSelect,
  onContextMenu,
  onToggle,
  contextMenuNodeId,
  readOnly,
  resources,
  selectedNodeId,
  sx,
  testId,
}: VirtualizedTreeProps) {
  return (
    <List
      data={resources}
      components={{ List: SearchList }}
      renderItemContent={(resource, { selected, focused }) => (
        <VirtualizedTreeNode
          TreeNodeLabel={TreeNodeLabel}
          onToggle={onToggle}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          readOnly={readOnly}
          selected={selected || resource.id === contextMenuNodeId}
          focused={focused}
          resource={resource}
        />
      )}
      selectedId={selectedNodeId}
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
