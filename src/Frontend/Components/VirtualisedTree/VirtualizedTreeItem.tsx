// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { Resources } from '../../../shared/shared-types';
import makeStyles from '@mui/styles/makeStyles';
import { OpossumColors } from '../../shared-styles';
import { NodeIcon } from './Icons';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ClassNameMap } from '@mui/styles';

const INDENT_PER_DEPTH_LEVEL = 12;
const SIMPLE_NODE_EXTRA_INDENT = 28;

const useStyles = makeStyles({
  treeItemLabel: {
    height: 19,
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover}`,
      cursor: 'pointer',
    },
  },
  treeItemLabelChildrenOfSelected: {
    backgroundColor: `${OpossumColors.lightestBlue}`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
  },
  treeItemLabelSelected: {
    backgroundColor: `${OpossumColors.lightestBlue} !important`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover} !important`,
    },
  },
  treeItemSpacer: {
    flexShrink: 0,
  },
  listItem: {
    display: 'flex',
  },
  clickableIcon: {
    width: 16,
    height: 20,
    padding: 0,
    margin: 0,
    color: OpossumColors.darkBlue,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
});

export interface VirtualizedTreeItemData {
  nodeId: string;
  resourceName: string;
  resource: Resources | 1;
  isExpandable: boolean;
  selected: string;
  onClick: (event: React.ChangeEvent<unknown>) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  isExpandedNode: boolean;
  nodeIdsToExpand: Array<string>;
  getTreeItemLabel: (
    resourceName: string,
    resource: Resources | 1,
    nodeId: string
  ) => ReactElement;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
}

export function VirtualizedTreeItem(
  props: VirtualizedTreeItemData
): ReactElement | null {
  const classes = useStyles();

  const marginRight =
    ((props.nodeId.match(/\//g) || []).length - 1) * INDENT_PER_DEPTH_LEVEL +
    (!props.isExpandable ? SIMPLE_NODE_EXTRA_INDENT : 0);

  return (
    <div className={classes.listItem}>
      <div className={classes.treeItemSpacer} style={{ width: marginRight }} />
      {props.isExpandable
        ? getExpandableNodeIcon(
            props.isExpandedNode,
            props.nodeId,
            props.nodeIdsToExpand,
            props.onToggle,
            classes,
            props.expandedNodeIcon,
            props.nonExpandedNodeIcon
          )
        : null}
      <div
        className={clsx(
          classes.treeItemLabel,
          isSelected(props.nodeId, props.selected)
            ? classes.treeItemLabelSelected
            : isChildOfSelected(props.nodeId, props.selected)
            ? classes.treeItemLabelChildrenOfSelected
            : null
        )}
        onClick={props.onClick}
      >
        {props.getTreeItemLabel(
          props.resourceName,
          props.resource,
          props.nodeId
        )}
      </div>
    </div>
  );
}

function getExpandableNodeIcon(
  isExpandedNode: boolean,
  nodeId: string,
  nodeIdsToExpand: Array<string>,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  classes: ClassNameMap<'clickableIcon'>,
  expandedNodeIcon: ReactElement = (
    <ChevronRightIcon className={clsx(classes.clickableIcon)} />
  ),
  nonExpandedNodeIcon: ReactElement = (
    <ExpandMoreIcon className={clsx(classes.clickableIcon)} />
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
