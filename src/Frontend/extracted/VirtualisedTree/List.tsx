// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { CSSProperties, ReactElement } from 'react';
import { FixedSizeList as VirtualizedList } from 'react-window';
import makeStyles from '@mui/styles/makeStyles';
import { HeightForTree, NumberOfDisplayedNodesForTree } from './types';

const DEFAULT_CARD_HEIGHT = 24;

// deprecated
const useStyles = makeStyles({
  scrollChild: {
    direction: 'ltr',
  },
});

interface ListProps {
  length: number;
  max: NumberOfDisplayedNodesForTree | HeightForTree;
  getListItem(index: number): ReactElement | null;
  cardVerticalDistance?: number;
  alwaysShowHorizontalScrollBar?: boolean;
  className?: string;
  indexToScrollTo?: number;
}

function maxHeightWasGiven(
  max: NumberOfDisplayedNodesForTree | HeightForTree
): max is HeightForTree {
  return Boolean((max as HeightForTree).height);
}

export function List(props: ListProps): ReactElement {
  const classes = useStyles();
  const cardHeight = props.cardVerticalDistance || DEFAULT_CARD_HEIGHT;
  const maxHeight = maxHeightWasGiven(props.max)
    ? props.max.height
    : props.max.numberOfDisplayedNodes * cardHeight;
  const currentHeight = props.length * cardHeight;
  const listHeight = props.alwaysShowHorizontalScrollBar
    ? maxHeight
    : Math.min(currentHeight, maxHeight);

  const scrollOffset = props.indexToScrollTo
    ? props.indexToScrollTo * cardHeight < maxHeight / 2
      ? 0
      : props.indexToScrollTo * cardHeight - maxHeight / 2
    : 0;

  return (
    <div className={props.className} style={{ maxHeight: currentHeight }}>
      <VirtualizedList
        initialScrollOffset={scrollOffset}
        height={listHeight}
        width={'vertical'}
        itemSize={cardHeight}
        itemCount={props.length}
        style={{
          overflow: `${
            props.alwaysShowHorizontalScrollBar ? 'scroll' : 'auto'
          } ${currentHeight < maxHeight ? 'hidden' : 'auto'}`,
        }}
      >
        {({
          index,
          style,
        }: {
          index: number;
          style: CSSProperties;
        }): ReactElement => (
          <div className={classes.scrollChild} style={style}>
            {props.getListItem(index)}
          </div>
        )}
      </VirtualizedList>
    </div>
  );
}
