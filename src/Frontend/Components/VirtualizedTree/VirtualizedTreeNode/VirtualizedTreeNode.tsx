// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiBox from '@mui/material/Box';
import { useEffect, useRef } from 'react';

import { ResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import { OpossumColors } from '../../../shared-styles';
import { getNodeIdsToExpand } from './VirtualizedTreeNode.util';

const INDENT_PER_DEPTH_LEVEL = 12;
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
    '&:focus .tree-node-selected-indicator': {
      display: 'block',
    },
    '&:focus': {
      outline: 'none',
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
  resource: ResourceTreeNodeData;
}

interface VirtualizedTreeNodeProps extends TreeNode {
  TreeNodeLabel: React.FC<TreeNode>;
  onSelect: (nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  readOnly?: boolean;
  selected: boolean;
  focused: boolean;
}

export function VirtualizedTreeNode({
  TreeNodeLabel,
  resource,
  onSelect,
  onToggle,
  readOnly,
  selected,
  focused,
}: VirtualizedTreeNodeProps) {
  const marginRight =
    resource.level * INDENT_PER_DEPTH_LEVEL +
    (resource.isExpandable ? 0 : SIMPLE_FOLDER_EXTRA_INDENT);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused) {
      ref.current?.focus();
    }
  }, [focused]);

  const handleClick = readOnly
    ? undefined
    : async () => {
        if (resource.isExpandable && !resource.isExpanded) {
          onToggle(await getNodeIdsToExpand(resource.id));
        }
        onSelect(resource.id);
      };

  return (
    <MuiBox
      sx={classes.listNode}
      onClick={handleClick}
      tabIndex={0}
      ref={ref}
      onKeyDown={async (event) => {
        if (['Enter'].includes(event.code)) {
          event.preventDefault();
          await handleClick?.();
        } else if (event.code === 'ArrowRight' && !resource.isExpanded) {
          event.preventDefault();
          onToggle?.([resource.id]);
        } else if (event.code === 'ArrowLeft' && resource.isExpanded) {
          event.preventDefault();
          onToggle?.([resource.id]);
        }
      }}
    >
      <MuiBox sx={classes.treeNodeSpacer} style={{ width: marginRight }} />
      {renderExpandableNodeIcon()}
      <MuiBox
        sx={{
          ...classes.treeItemLabel,
          cursor: handleClick ? 'pointer' : 'default',
        }}
      >
        <TreeNodeLabel resource={resource} />
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
    if (!resource.isExpandable) {
      return null;
    }

    return (
      <MuiBox
        onClick={async (event) => {
          event.stopPropagation();
          onToggle(await getNodeIdsToExpand(resource.id));
        }}
        aria-label={
          resource.isExpanded
            ? `collapse ${resource.id}`
            : `expand ${resource.id}`
        }
      >
        {resource.isExpanded ? (
          <ExpandMoreIcon sx={classes.treeExpandIcon} />
        ) : (
          <ChevronRightIcon sx={classes.treeExpandIcon} />
        )}
      </MuiBox>
    );
  }
}
