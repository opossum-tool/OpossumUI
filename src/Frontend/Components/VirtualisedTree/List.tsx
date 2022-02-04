// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { CSSProperties, ReactElement } from 'react';
import { FixedSizeList as VirtualizedList } from 'react-window';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles({
  scrollChild: {
    direction: 'ltr',
  },
});

interface Height {
  height: number;
}

interface NumberOfDisplayedItems {
  numberOfDisplayedItems: number;
}

interface ListProps {
  length: number;
  max: NumberOfDisplayedItems | Height;
  getListItem(index: number): ReactElement | null;
  cardVerticalDistance?: number;
  alwaysShowHorizontalScrollBar?: boolean;
  className?: string;
}

function maxHeightWasGiven(
  max: NumberOfDisplayedItems | Height
): max is Height {
  return Boolean((max as Height).height);
}

export function List(props: ListProps): ReactElement {
  const classes = useStyles();
  const cardHeight = props.cardVerticalDistance || 24;
  const maxHeight = maxHeightWasGiven(props.max)
    ? props.max.height
    : props.max.numberOfDisplayedItems * cardHeight;
  const currentHeight = props.length * cardHeight;
  const listHeight = props.alwaysShowHorizontalScrollBar
    ? maxHeight
    : Math.min(currentHeight, maxHeight);

  return (
    <div className={props.className} style={{ maxHeight: currentHeight }}>
      <VirtualizedList
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
