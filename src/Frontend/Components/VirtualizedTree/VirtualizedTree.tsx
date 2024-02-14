// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { useMemo } from 'react';

import { useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/resource-selectors';
import { List } from '../List/List';
import { getTreeNodeProps, NodesForTree } from './VirtualizedTree.util';
import { VirtualizedTreeNode } from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps {
  nodes: NodesForTree;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => React.ReactElement;
  expandedIds: Array<string>;
  selectedNodeId?: string;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  width?: number | string;
  sx?: SxProps;
  breakpoints?: Set<string>;
  readOnly?: boolean;
}

export function VirtualizedTree(props: VirtualizedTreeProps) {
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const treeNodeProps = getTreeNodeProps(
    props.nodes,
    '',
    props.expandedIds,
    props.selectedNodeId || '',
    filesWithChildren,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.breakpoints,
    props.readOnly,
  );
  const indexToScrollTo = useMemo(
    () =>
      props.selectedNodeId
        ? treeNodeProps.findIndex(
            ({ nodeId }) => nodeId === props.selectedNodeId,
          )
        : -1,
    [props.selectedNodeId, treeNodeProps],
  );

  return (
    <MuiBox sx={{ flex: 1, ...props.sx }}>
      <List
        length={treeNodeProps.length}
        cardHeight={20}
        getListItem={(index) => {
          if (!(index in treeNodeProps)) {
            return null;
          }

          return <VirtualizedTreeNode {...treeNodeProps[index]} />;
        }}
        indexToScrollTo={indexToScrollTo}
      />
    </MuiBox>
  );
}
