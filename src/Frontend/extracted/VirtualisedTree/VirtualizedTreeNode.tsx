// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { NodesForTree, TreeNodeStyle } from './types';
import makeStyles from '@mui/styles/makeStyles';
import { NodeIcon } from './Icons';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const INDENT_PER_DEPTH_LEVEL = 12;
const SIMPLE_NODE_EXTRA_INDENT = 28;

const useStyles = makeStyles({
  treeNodeSpacer: {
    flexShrink: 0,
  },
  listNode: {
    display: 'flex',
  },
  clickableIcon: {
    width: 16,
    height: 20,
    padding: 0,
    margin: 0,
  },
});

export interface VirtualizedTreeNodeData {
  nodeId: string;
  nodeName: string;
  node: NodesForTree | 1;
  isExpandable: boolean;
  selected: string;
  onClick: (event: React.ChangeEvent<unknown>) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  isExpandedNode: boolean;
  nodeIdsToExpand: Array<string>;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string
  ) => ReactElement;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
  treeNodeStyle?: TreeNodeStyle;
  nodeHeight: number;
}

export function VirtualizedTreeNode(
  props: VirtualizedTreeNodeData
): ReactElement | null {
  const classes = useStyles();

  const marginRight =
    ((props.nodeId.match(/\//g) || []).length - 1) * INDENT_PER_DEPTH_LEVEL +
    (!props.isExpandable ? SIMPLE_NODE_EXTRA_INDENT : 0);

  return (
    <div className={classes.listNode} style={{ height: props.nodeHeight }}>
      <div className={classes.treeNodeSpacer} style={{ width: marginRight }} />
      {props.isExpandable
        ? getExpandableNodeIcon(
            props.isExpandedNode,
            props.nodeId,
            props.nodeIdsToExpand,
            props.onToggle,
            props.treeNodeStyle?.treeExpandIcon || classes.clickableIcon,
            props.expandedNodeIcon,
            props.nonExpandedNodeIcon
          )
        : null}
      <div
        className={clsx(
          props.treeNodeStyle?.root,
          isSelected(props.nodeId, props.selected)
            ? props.treeNodeStyle?.selected
            : isChildOfSelected(props.nodeId, props.selected)
            ? props.treeNodeStyle?.childrenOfSelected
            : null
        )}
        onClick={props.onClick}
      >
        {props.getTreeNodeLabel(props.nodeName, props.node, props.nodeId)}
      </div>
    </div>
  );
}

function getExpandableNodeIcon(
  isExpandedNode: boolean,
  nodeId: string,
  nodeIdsToExpand: Array<string>,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  iconClassName: string,
  expandedNodeIcon: ReactElement = <ExpandMoreIcon className={iconClassName} />,
  nonExpandedNodeIcon: ReactElement = (
    <ChevronRightIcon className={iconClassName} />
  )
): ReactElement {
  const ariaLabel = isExpandedNode ? `expand ${nodeId}` : `collapse ${nodeId}`;
  const icon = isExpandedNode ? expandedNodeIcon : nonExpandedNodeIcon;
  return (
    <NodeIcon
      onClick={(): void => {
        onToggle(nodeIdsToExpand);
      }}
      ariaLabel={ariaLabel}
      icon={icon}
    />
  );
}

function isSelected(nodeId: string, selected: string): boolean {
  return nodeId === selected;
}

function isChildOfSelected(nodeId: string, selected: string): boolean {
  return (
    nodeId.startsWith(selected) &&
    !isSelected(nodeId, selected) &&
    selected.slice(-1) === '/'
  );
}
