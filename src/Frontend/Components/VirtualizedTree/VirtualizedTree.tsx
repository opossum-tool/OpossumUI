// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/system';
import type { MouseEvent } from 'react';

import type {
  ResourceTreeNodeBase,
  ResourceTreeNodeData,
} from '../../../ElectronBackend/api/resourceTree';
import type { ResourceTreeFilters } from '../../../ElectronBackend/api/resourceTreeFilters';
import { List } from '../List/List';
import { SearchList } from '../SearchList/SearchList';
import {
  type TreeNode,
  VirtualizedTreeNode,
} from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps<T extends ResourceTreeNodeBase> {
  TreeNodeLabel: React.FC<TreeNode<T>>;
  resources: Array<T>;
  onSelect: (nodeId: string) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>, resource: T) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  contextMenuNodeId?: string;
  expansionFilters?: ResourceTreeFilters;
  readOnly?: boolean;
  selectedNodeId?: string;
  sx?: SxProps;
  testId?: string;
}

export function VirtualizedTree<
  T extends ResourceTreeNodeBase = ResourceTreeNodeData,
>({
  TreeNodeLabel,
  onSelect,
  onContextMenu,
  onToggle,
  contextMenuNodeId,
  expansionFilters,
  readOnly,
  resources,
  selectedNodeId,
  sx,
  testId,
}: VirtualizedTreeProps<T>) {
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
          selected={selected}
          highlighted={selected || resource.id === contextMenuNodeId}
          focused={focused}
          resource={resource}
          expansionFilters={expansionFilters}
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
