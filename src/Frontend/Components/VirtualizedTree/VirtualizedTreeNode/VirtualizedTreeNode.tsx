// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiBox from '@mui/material/Box';

import { Resources } from '../../../../shared/shared-types';
import { OpossumColors } from '../../../shared-styles';
import { getNodeIdsToExpand } from './VirtualizedTreeNode.util';

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

export interface TreeNode {
  nodeName: string;
  node: Resources | 1;
  nodeId: string;
}

interface VirtualizedTreeNodeProps extends TreeNode {
  TreeNodeLabel: React.FC<TreeNode>;
  isExpandedNode: boolean;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  readOnly?: boolean;
  selected: boolean;
}

export function VirtualizedTreeNode({
  TreeNodeLabel,
  isExpandedNode,
  node,
  nodeId,
  nodeName,
  onSelect,
  onToggle,
  readOnly,
  selected,
}: VirtualizedTreeNodeProps) {
  const isExpandable = node !== 1 && Object.keys(node).length !== 0;
  const marginRight =
    ((nodeId.match(/\//g) || []).length - 1) * INDENT_PER_DEPTH_LEVEL +
    (isExpandable
      ? 0
      : nodeId.endsWith('/')
        ? SIMPLE_FOLDER_EXTRA_INDENT
        : SIMPLE_NODE_EXTRA_INDENT);

  const handleClick = readOnly
    ? undefined
    : () => {
        if (isExpandable && !isExpandedNode) {
          onToggle(getNodeIdsToExpand(nodeId, node));
        }
        onSelect(nodeId);
      };

  return (
    <MuiBox sx={classes.listNode} onClick={handleClick}>
      <MuiBox sx={classes.treeNodeSpacer} style={{ width: marginRight }} />
      {renderExpandableNodeIcon()}
      <MuiBox
        sx={{
          ...classes.treeItemLabel,
          cursor: handleClick ? 'pointer' : 'default',
        }}
      >
        <TreeNodeLabel nodeName={nodeName} node={node} nodeId={nodeId} />
      </MuiBox>
      <MuiBox />
      <MuiBox
        className={'tree-node-selected-indicator'}
        sx={{
          ...classes.treeNodeSelectedIndicator,
          display: selected ? 'block' : 'none',
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          opacity: selected ? 1 : 0.5,
          cursor: handleClick ? 'pointer' : 'default',
        }}
      />
    </MuiBox>
  );

  function renderExpandableNodeIcon() {
    if (!isExpandable) {
      return null;
    }

    return (
      <MuiBox
        onClick={(event) => {
          event.stopPropagation();
          onToggle(getNodeIdsToExpand(nodeId, node));
        }}
        aria-label={isExpandedNode ? `collapse ${nodeId}` : `expand ${nodeId}`}
      >
        {isExpandedNode ? (
          <ExpandMoreIcon sx={classes.treeExpandIcon} />
        ) : (
          <ChevronRightIcon sx={classes.treeExpandIcon} />
        )}
      </MuiBox>
    );
  }
}
