// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { List } from './List';
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
import {
  VirtualizedTreeItem,
  VirtualizedTreeItemData,
} from './VirtualizedTreeItem';
import { getTreeItemProps } from './get-tree-item-props';

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
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps
): ReactElement | null {
  const classes = useStyles();

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const treeItemProps: Array<VirtualizedTreeItemData> = getTreeItemProps(
    props.resources,
    '',
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
          treeItemProps.length,
          DEFAULT_MAX_TREE_DISPLAYED_ITEMS,
        ]) as number,
      };

  return props.resources ? (
    <div aria-label={props.ariaLabel} className={classes.root}>
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
              }}
            />
          )}
          alwaysShowHorizontalScrollBar={true}
        />
      </div>
    </div>
  ) : null;
}
