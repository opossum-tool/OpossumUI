// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { useMemo } from 'react';

import { List } from '../List/List';
import { ResizableBox } from '../ResizableBox/ResizableBox';
import {
  getTreeNodeProps,
  NodeIdPredicateForTree,
  NodesForTree,
  TreeNodeStyle,
} from './VirtualizedTree.util';
import { VirtualizedTreeNode } from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps {
  nodes: NodesForTree;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => React.ReactElement;
  expandedIds: Array<string>;
  selectedNodeId: string;
  isFakeNonExpandableNode: NodeIdPredicateForTree;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  cardHeight: number;
  width?: number | string;
  expandedNodeIcon?: React.ReactElement;
  nonExpandedNodeIcon?: React.ReactElement;
  sx?: SxProps;
  treeNodeStyle?: TreeNodeStyle;
  breakpoints?: Set<string>;
  locatorIcon?: React.ReactElement;
  locatedResourceIcon?: React.ReactElement;
  locatedResources?: Set<string>;
  resourcesWithLocatedChildren?: Set<string>;
  resizable?: boolean;
}

export function VirtualizedTree(props: VirtualizedTreeProps) {
  const treeNodeProps = getTreeNodeProps(
    props.nodes,
    '',
    props.expandedIds,
    props.selectedNodeId,
    props.isFakeNonExpandableNode,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.locatedResources,
    props.resourcesWithLocatedChildren,
    props.breakpoints,
  );
  const indexToScrollTo = useMemo(
    () =>
      treeNodeProps.findIndex(({ nodeId }) => nodeId === props.selectedNodeId),
    [props.selectedNodeId, treeNodeProps],
  );

  return props.nodes ? (
    <ResizableBox
      aria-label={'resource browser'}
      sx={props.sx}
      defaultSize={{ width: props.width ?? 'auto', height: '100%' }}
      enable={props.resizable === true ? undefined : false}
    >
      {props.locatorIcon}
      <List
        length={treeNodeProps.length}
        cardHeight={props.cardHeight}
        getListItem={(index) => (
          <VirtualizedTreeNode
            {...treeNodeProps[index]}
            expandedNodeIcon={props.expandedNodeIcon}
            nonExpandedNodeIcon={props.nonExpandedNodeIcon}
            locatedResourceIcon={props.locatedResourceIcon}
            treeNodeStyle={props.treeNodeStyle}
          />
        )}
        indexToScrollTo={indexToScrollTo}
        fullHeight
      />
    </ResizableBox>
  ) : null;
}
