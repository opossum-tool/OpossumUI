// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';

import { QueryResult } from '../../../ElectronBackend/api/queries';
import { List } from '../List/List';
import { SearchList } from '../SearchList/SearchList';
import {
  TreeNode,
  VirtualizedTreeNode,
} from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps {
  TreeNodeLabel: React.FC<TreeNode>;
  resources: QueryResult<'getResourceTree'>['treeNodes'];
  onSelect: (nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  readOnly?: boolean;
  selectedNodeId?: string;
  sx?: SxProps;
  testId?: string;
}

export function VirtualizedTree({
  TreeNodeLabel,
  onSelect,
  onToggle,
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
          readOnly={readOnly}
          selected={selected}
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
