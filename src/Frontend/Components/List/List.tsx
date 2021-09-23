// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { CSSProperties, ReactElement } from 'react';
import { FixedSizeList as VirtualizedList } from 'react-window';
import { Height, NumberOfDisplayedItems } from '../../types/types';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

interface ListProps {
  length: number;
  max: NumberOfDisplayedItems | Height;
  getListItem(index: number): ReactElement | null;
  cardVerticalDistance?: number;
  alwaysShowHorizontalScrollBar?: boolean;
  addPaddingBottom?: boolean;
  allowHorizontalScrolling?: boolean;
}

const useStyles = makeStyles({
  paddingBottomScrollbar: { paddingBottom: 18 },
  horizontalScrollbarFix: { overflowX: 'scroll' },
});

function maxHeightWasGiven(
  max: NumberOfDisplayedItems | Height
): max is Height {
  return Boolean((max as Height).height);
}

export function List(props: ListProps): ReactElement {
  const classes = useStyles();
  const cardHeight = props.cardVerticalDistance || 24;
  const minHeight = cardHeight + 6;
  const maxHeight = maxHeightWasGiven(props.max)
    ? props.max.height
    : props.max.numberOfDisplayedItems * (cardHeight + 1);
  const currentHeight = props.length * (cardHeight + 1);
  const listHeight = props.alwaysShowHorizontalScrollBar
    ? maxHeight + 1
    : Math.min(currentHeight, maxHeight) + 1;

  return (
    <div style={{ minHeight }}>
      <VirtualizedList
        height={listHeight}
        width={'vertical'}
        itemSize={cardHeight}
        itemCount={props.length}
        className={clsx(
          props.alwaysShowHorizontalScrollBar
            ? classes.horizontalScrollbarFix
            : null,
          props.addPaddingBottom ? classes.paddingBottomScrollbar : null
        )}
      >
        {({
          index,
          style,
        }: {
          index: number;
          style: CSSProperties;
        }): ReactElement => (
          <div
            style={
              props.allowHorizontalScrolling
                ? { ...style, minWidth: '100%', width: 'fit-content' }
                : style
            }
          >
            {props.getListItem(index)}
          </div>
        )}
      </VirtualizedList>
    </div>
  );
}
