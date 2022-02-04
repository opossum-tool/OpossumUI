// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { List } from './List';
import {
  HeightForTree,
  ItemsForTree,
  NumberOfDisplayedItemsForTree,
  PathPredicateForTree,
  TreeItemStyle,
} from './types';
import { min } from 'lodash';
import {
  VirtualizedTreeItem,
  VirtualizedTreeItemData,
} from './VirtualizedTreeItem';
import { getTreeItemProps } from './utils/get-tree-item-props';
import clsx from 'clsx';

const useStyles = makeStyles({
  content: {
    height: '100%',
  },
});

const DEFAULT_MAX_TREE_DISPLAYED_ITEMS = 5;

interface VirtualizedTreeProps {
  items: ItemsForTree;
  getTreeItemLabel: (
    itemName: string,
    item: ItemsForTree | 1,
    nodeId: string
  ) => ReactElement;
  expandedIds: Array<string>;
  selectedItemId: string;
  isFileWithChildren: PathPredicateForTree;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  ariaLabel?: string;
  cardHeight: number;
  maxHeight?: number;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
  className?: string;
  alwaysShowHorizontalScrollBar?: boolean;
  treeItemStyle?: TreeItemStyle;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps
): ReactElement | null {
  const classes = useStyles();

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const treeItemProps: Array<VirtualizedTreeItemData> = getTreeItemProps(
    props.items,
    '',
    props.expandedIds,
    props.selectedItemId,
    props.isFileWithChildren,
    props.onSelect,
    props.onToggle,
    props.getTreeItemLabel
  );

  const maxListLength: NumberOfDisplayedItemsForTree | HeightForTree =
    props.maxHeight
      ? { height: props.maxHeight }
      : {
          numberOfDisplayedItems: min([
            treeItemProps.length,
            DEFAULT_MAX_TREE_DISPLAYED_ITEMS,
          ]) as number,
        };

  return props.items ? (
    <div aria-label={props.ariaLabel} className={clsx(props.className)}>
      <div className={classes.content}>
        <List
          length={treeItemProps.length}
          max={maxListLength}
          cardVerticalDistance={props.cardHeight}
          getListItem={(index: number): ReactElement => (
            <VirtualizedTreeItem
              {...{
                ...treeItemProps[index],
                expandedNodeIcon: props.expandedNodeIcon,
                nonExpandedNodeIcon: props.nonExpandedNodeIcon,
                treeItemStyle: props.treeItemStyle,
              }}
            />
          )}
          alwaysShowHorizontalScrollBar={props.alwaysShowHorizontalScrollBar}
        />
      </div>
    </div>
  ) : null;
}
