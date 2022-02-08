// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { List } from './List';

import clsx from 'clsx';
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

const useStyles = makeStyles({
  content: {
    height: '100%',
  },
});

const DEFAULT_MAX_TREE_DISPLAYED_NODES = 5;

interface VirtualizedTreeProps {
  nodes: NodesForTree;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string
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
  className?: string;
  treeNodeStyle?: TreeNodeStyle;
  alwaysShowHorizontalScrollBar?: boolean;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps
): ReactElement | null {
  const classes = useStyles();

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const treeNodeProps: Array<VirtualizedTreeNodeData> = getTreeNodeProps(
    props.nodes,
    '',
    props.expandedIds,
    props.selectedNodeId,
    props.isFakeNonExpandableNode,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.cardHeight
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

  return props.nodes ? (
    <div aria-label={props.ariaLabel} className={clsx(props.className)}>
      <div className={classes.content}>
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
                treeNodeStyle: props.treeNodeStyle,
              }}
            />
          )}
          alwaysShowHorizontalScrollBar={props.alwaysShowHorizontalScrollBar}
        />
      </div>
    </div>
  ) : null;
}
