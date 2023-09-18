// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NodesForTree, TreeNodeStyle } from './types';
import { NodeIcon } from './Icons';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';
import {
  isBreakpointOrChildOfBreakpoint,
  isChildOfSelected,
  isSelected,
} from './utils/get-tree-node-props';

const INDENT_PER_DEPTH_LEVEL = 12;
const SIMPLE_NODE_EXTRA_INDENT = 28;

const classes = {
  treeNodeSpacer: {
    flexShrink: 0,
  },
  listNode: {
    display: 'flex',
  },
  clickableIcon: {
    width: '16px',
    height: '20px',
    padding: '0px',
    margin: '0px',
  },
};

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
    nodeId: string,
  ) => ReactElement;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
  treeNodeStyle?: TreeNodeStyle;
  nodeHeight: number;
  breakpoints?: Set<string>;
  isLocatedNode: boolean;
  locatedResourceIcon?: ReactElement;
}

export function VirtualizedTreeNode(
  props: VirtualizedTreeNodeData,
): ReactElement | null {
  const marginRight =
    ((props.nodeId.match(/\//g) || []).length - 1) * INDENT_PER_DEPTH_LEVEL +
    (!props.isExpandable ? SIMPLE_NODE_EXTRA_INDENT : 0);

  return (
    <MuiBox sx={classes.listNode} style={{ height: props.nodeHeight }}>
      <MuiBox sx={classes.treeNodeSpacer} style={{ width: marginRight }} />
      {props.isExpandable
        ? getExpandableNodeIcon(
            props.isExpandedNode,
            props.nodeId,
            props.nodeIdsToExpand,
            props.onToggle,
            props.treeNodeStyle?.treeExpandIcon || classes.clickableIcon,
            props.expandedNodeIcon,
            props.nonExpandedNodeIcon,
          )
        : null}
      <MuiBox
        sx={
          {
            ...(props.treeNodeStyle?.root || {}),
            ...((isSelected(props.nodeId, props.selected)
              ? props.treeNodeStyle?.selected
              : isChildOfSelected(props.nodeId, props.selected)
              ? !isBreakpointOrChildOfBreakpoint(
                  props.nodeId,
                  props.selected,
                  props.breakpoints,
                )
                ? props.treeNodeStyle?.childrenOfSelected
                : null
              : null) || {}),
          } as SxProps
        }
        onClick={props.onClick}
      >
        {props.getTreeNodeLabel(props.nodeName, props.node, props.nodeId)}
      </MuiBox>
      <MuiBox />
      {props.isLocatedNode ? props.locatedResourceIcon : null}
    </MuiBox>
  );
}

function getExpandableNodeIcon(
  isExpandedNode: boolean,
  nodeId: string,
  nodeIdsToExpand: Array<string>,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  sx: SxProps,
  expandedNodeIcon: ReactElement = <ExpandMoreIcon sx={sx} />,
  nonExpandedNodeIcon: ReactElement = <ChevronRightIcon sx={sx} />,
): ReactElement {
  const ariaLabel = isExpandedNode ? `collapse ${nodeId}` : `expand ${nodeId}`;
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
