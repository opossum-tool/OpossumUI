// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { List } from './List';
import {
  HeightForTree,
  NodeIdPredicateForTree,
  NodesForTree,
  NumberOfDisplayedNodesForTree,
  TreeNodeStyle,
} from './types';
import { min } from 'lodash';
import {
  VirtualizedTreeNode,
  VirtualizedTreeNodeData,
} from './VirtualizedTreeNode';
import { getTreeNodeProps } from './utils/get-tree-node-props';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';

const classes = {
  content: {
    height: '100%',
  },
};

const DEFAULT_MAX_TREE_DISPLAYED_NODES = 5;

interface VirtualizedTreeProps {
  nodes: NodesForTree;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => ReactElement;
  expandedIds: Array<string>;
  selectedNodeId: string;
  isFakeNonExpandableNode: NodeIdPredicateForTree;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  ariaLabel?: string;
  cardHeight: number;
  maxHeight?: number;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
  sx?: SxProps;
  treeNodeStyle?: TreeNodeStyle;
  alwaysShowHorizontalScrollBar?: boolean;
  breakpoints?: Set<string>;
  locatorIcon?: ReactElement;
  locatedResourceIcon?: ReactElement;
  locatedResources?: Set<string>;
  resourcesWithLocatedChildren?: Set<string>;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps,
): ReactElement | null {
  const treeNodeProps: Array<VirtualizedTreeNodeData> = getTreeNodeProps(
    props.nodes,
    '',
    props.expandedIds,
    props.selectedNodeId,
    props.isFakeNonExpandableNode,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.cardHeight,
    props.locatedResources,
    props.resourcesWithLocatedChildren,
    props.breakpoints,
  );

  const maxListLength: NumberOfDisplayedNodesForTree | HeightForTree =
    props.maxHeight
      ? { height: props.maxHeight }
      : {
          numberOfDisplayedNodes: min([
            treeNodeProps.length,
            DEFAULT_MAX_TREE_DISPLAYED_NODES,
          ]) as number,
        };

  const indexToScrollTo = treeNodeProps.findIndex(
    (itemData) => itemData.nodeId === props.selectedNodeId,
  );

  return props.nodes ? (
    <MuiBox aria-label={props.ariaLabel} sx={props.sx}>
      {props.locatorIcon}
      <MuiBox sx={classes.content}>
        <List
          length={treeNodeProps.length}
          max={maxListLength}
          cardVerticalDistance={props.cardHeight}
          getListItem={(index: number): ReactElement => (
            <VirtualizedTreeNode
              {...{
                ...treeNodeProps[index],
                expandedNodeIcon: props.expandedNodeIcon,
                nonExpandedNodeIcon: props.nonExpandedNodeIcon,
                locatedResourceIcon: props.locatedResourceIcon,
                treeNodeStyle: props.treeNodeStyle,
              }}
            />
          )}
          alwaysShowHorizontalScrollBar={props.alwaysShowHorizontalScrollBar}
          indexToScrollTo={indexToScrollTo}
        />
      </MuiBox>
    </MuiBox>
  ) : null;
}
