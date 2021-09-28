// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { CSSProperties, ReactElement } from 'react';
import { FixedSizeList as VirtualizedList } from 'react-window';
import { Height, NumberOfDisplayedItems } from '../../types/types';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  root: {
    backgroundColor: OpossumColors.white,
  },
  paddingBottomScrollbar: { paddingBottom: 18 },
  horizontalScrollbarFix: { overflowX: 'scroll' },
});

interface ListProps {
  length: number;
  max: NumberOfDisplayedItems | Height;
  getListItem(index: number): ReactElement | null;
  cardVerticalDistance?: number;
  alwaysShowHorizontalScrollBar?: boolean;
  addPaddingBottom?: boolean;
  allowHorizontalScrolling?: boolean;
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
    : props.max.numberOfDisplayedItems * (cardHeight + 1);
  const currentHeight = props.length * (cardHeight + 1);
  const listHeight = props.alwaysShowHorizontalScrollBar
    ? maxHeight
    : Math.min(currentHeight, maxHeight);

  return (
    <div className={classes.root} style={{ maxHeight: currentHeight }}>
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
                ? {
                    ...style,
                    minWidth: '100%',
                    width: 'fit-content',
                  }
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
