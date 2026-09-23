// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiBox from '@mui/material/Box';
import { type MouseEvent, useEffect, useRef } from 'react';

import type {
  ResourceTreeNodeBase,
  ResourceTreeNodeData,
} from '../../../../ElectronBackend/api/resourceTree';
import type { ResourceTreeFilters } from '../../../../ElectronBackend/api/resourceTreeFilters';
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
    p: 0,
    m: 0,
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
    p: 0,
    m: 0,
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

export interface TreeNode<
  T extends ResourceTreeNodeBase = ResourceTreeNodeData,
> {
  resource: T;
}

interface VirtualizedTreeNodeProps<
  T extends ResourceTreeNodeBase,
> extends TreeNode<T> {
  TreeNodeLabel: React.FC<TreeNode<T>>;
  onSelect: (nodeId: string) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>, resource: T) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  readOnly?: boolean;
  selected: boolean;
  highlighted: boolean;
  focused: boolean;
  expansionFilters?: ResourceTreeFilters;
}

export function VirtualizedTreeNode<
  T extends ResourceTreeNodeBase = ResourceTreeNodeData,
>({
  TreeNodeLabel,
  resource,
  onSelect,
  onContextMenu,
  onToggle,
  readOnly,
  selected,
  highlighted,
  focused,
  expansionFilters,
}: VirtualizedTreeNodeProps<T>) {
  const marginRight =
    resource.level * INDENT_PER_DEPTH_LEVEL +
    (resource.isExpandable ? 0 : SIMPLE_FOLDER_EXTRA_INDENT);

  const ref = useRef<HTMLDivElement>(null);
  const expansionFiltersRef = useRef(expansionFilters);
  expansionFiltersRef.current = expansionFilters;

  async function expand() {
    const filters = expansionFiltersRef.current;
    const nodeIds = await getNodeIdsToExpand(resource.id, filters);
    if (filters === expansionFiltersRef.current) {
      onToggle(nodeIds);
    }
  }

  useEffect(() => {
    if (focused) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [focused]);

  const handleClick = readOnly
    ? undefined
    : async () => {
        if (resource.isExpandable && !resource.isExpanded) {
          await expand();
        }
        onSelect(resource.id);
      };

  return (
    <MuiBox
      role={'treeitem'}
      aria-label={resource.labelText}
      aria-selected={selected}
      data-resource-path={resource.id}
      sx={classes.listNode}
      onClick={handleClick}
      onContextMenu={(event) => onContextMenu?.(event, resource)}
      tabIndex={0}
      ref={ref}
      onKeyDown={async (event) => {
        if (['Enter'].includes(event.code)) {
          event.preventDefault();
          await handleClick?.();
        } else if (event.code === 'ArrowRight' && !resource.isExpanded) {
          event.preventDefault();
          if (resource.isExpandable) {
            await expand();
          }
        } else if (event.code === 'ArrowLeft' && resource.isExpanded) {
          event.preventDefault();
          onToggle([resource.id]);
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
          display: highlighted ? 'block' : 'none',
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          opacity: highlighted ? 1 : 0.5,
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
          if (resource.isExpanded) {
            onToggle([resource.id]);
          } else {
            await expand();
          }
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
