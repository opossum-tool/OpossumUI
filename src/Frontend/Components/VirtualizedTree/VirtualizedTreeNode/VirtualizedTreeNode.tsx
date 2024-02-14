// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiBox from '@mui/material/Box';

import { OpossumColors } from '../../../shared-styles';
import { isSelected, NodesForTree } from '../VirtualizedTree.util';

const INDENT_PER_DEPTH_LEVEL = 12;
const SIMPLE_NODE_EXTRA_INDENT = 28;
const SIMPLE_FOLDER_EXTRA_INDENT = 16;

const classes = {
  treeNodeSpacer: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
  },
  listNode: {
    display: 'flex',
    height: '20px',
    '&:hover .tree-node-selected-indicator': {
      display: 'block',
    },
  },
  clickableIcon: {
    width: '16px',
    height: '20px',
    padding: '0px',
    margin: '0px',
  },
  treeItemLabel: {
    position: 'relative',
    zIndex: 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  treeExpandIcon: {
    position: 'relative',
    zIndex: 1,
    width: '16px',
    height: '20px',
    padding: '0px',
    margin: '0px',
    color: OpossumColors.darkBlue,
    '&:hover': {
      color: OpossumColors.black,
    },
  },
  treeNodeSelectedIndicator: {
    position: 'absolute',
    width: '100%',
    height: '20px',
    background: 'white',
    zIndex: 0,
    left: 0,
  },
};

export interface VirtualizedTreeNodeProps {
  nodeId: string;
  nodeName: string;
  node: NodesForTree | 1;
  isExpandable: boolean;
  selected: string;
  onClick?: (event: React.ChangeEvent<unknown>) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  isExpandedNode: boolean;
  nodeIdsToExpand: Array<string>;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => React.ReactElement;
  breakpoints?: Set<string>;
}

export function VirtualizedTreeNode(props: VirtualizedTreeNodeProps) {
  const marginRight =
    ((props.nodeId.match(/\//g) || []).length - 1) * INDENT_PER_DEPTH_LEVEL +
    (!props.isExpandable
      ? props.nodeId.endsWith('/')
        ? SIMPLE_FOLDER_EXTRA_INDENT
        : SIMPLE_NODE_EXTRA_INDENT
      : 0);
  const selected = isSelected(props.nodeId, props.selected);

  return (
    <MuiBox sx={classes.listNode} onClick={props.onClick}>
      <MuiBox sx={classes.treeNodeSpacer} style={{ width: marginRight }} />
      {renderExpandableNodeIcon()}
      <MuiBox
        sx={{
          ...classes.treeItemLabel,
          cursor: props.onClick ? 'pointer' : 'default',
        }}
      >
        {props.getTreeNodeLabel(props.nodeName, props.node, props.nodeId)}
      </MuiBox>
      <MuiBox />
      <MuiBox
        className={'tree-node-selected-indicator'}
        sx={{
          ...classes.treeNodeSelectedIndicator,
          display: selected ? 'block' : 'none',
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          opacity: selected ? 1 : 0.5,
          cursor: props.onClick ? 'pointer' : 'default',
        }}
      />
    </MuiBox>
  );

  function renderExpandableNodeIcon() {
    if (!props.isExpandable) {
      return null;
    }

    return (
      <MuiBox
        onClick={(event): void => {
          event.stopPropagation();
          props.onToggle(props.nodeIdsToExpand);
        }}
        aria-label={
          props.isExpandedNode
            ? `collapse ${props.nodeId}`
            : `expand ${props.nodeId}`
        }
      >
        {props.isExpandedNode ? (
          <ExpandMoreIcon sx={classes.treeExpandIcon} />
        ) : (
          <ChevronRightIcon sx={classes.treeExpandIcon} />
        )}
      </MuiBox>
    );
  }
}
