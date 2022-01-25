// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { renderTree } from './render-tree';
import { List } from '../List/List';
import {
  OpossumColors,
  resourceBrowserWidthInPixels,
} from '../../shared-styles';
import { Resources } from '../../../shared/shared-types';
import {
  Height,
  NumberOfDisplayedItems,
  PathPredicate,
} from '../../types/types';
import { min } from 'lodash';

const useStyles = makeStyles({
  root: {
    width: resourceBrowserWidthInPixels,
    padding: '4px 0',
    background: OpossumColors.white,
    height: '100%',
  },
  content: {
    height: '100%',
  },
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
});

const DEFAULT_MAX_TREE_DISPLAYED_ITEMS = 5;

interface VirtualizedTreeProps {
  resources: Resources;
  getTreeItemLabel: (
    resourceName: string,
    resource: Resources | 1,
    nodeId: string
  ) => ReactElement;
  expandedIds: Array<string>;
  selectedResourceId: string;
  isFileWithChildren: PathPredicate;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  ariaLabel?: string;
  cardHeight: number;
  maxHeight?: number;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps
): ReactElement | null {
  const classes = useStyles();

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const treeItems: Array<ReactElement> = renderTree(
    props.resources,
    '',
    classes,
    props.expandedIds,
    props.selectedResourceId,
    props.isFileWithChildren,
    props.onSelect,
    props.onToggle,
    props.getTreeItemLabel
  );

  const maxListLength: NumberOfDisplayedItems | Height = props.maxHeight
    ? { height: props.maxHeight }
    : {
        numberOfDisplayedItems: min([
          treeItems.length,
          DEFAULT_MAX_TREE_DISPLAYED_ITEMS,
        ]) as number,
      };

  return props.resources ? (
    <div aria-label={props.ariaLabel} className={classes.root}>
      <div className={classes.content}>
        <List
          length={treeItems.length}
          max={maxListLength}
          cardVerticalDistance={props.cardHeight}
          getListItem={(index: number): ReactElement => treeItems[index]}
          alwaysShowHorizontalScrollBar={true}
        />
      </div>
    </div>
  ) : null;
}
