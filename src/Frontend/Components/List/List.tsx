// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { CSSProperties, ReactElement } from 'react';
import { FixedSizeList as VirtualizedList } from 'react-window';
import { Height, NumberOfDisplayedItems } from '../../types/types';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';

const DEFAULT_CARD_HEIGHT = 24;

const classes = {
  scrollChild: {
    direction: 'ltr',
  },
};

interface Props {
  addPaddingBottom?: boolean;
  allowHorizontalScrolling?: boolean;
  alwaysShowHorizontalScrollBar?: boolean;
  cardVerticalDistance?: number;
  getListItem(index: number): ReactElement | null;
  indexToScrollTo?: number;
  leftScrollBar?: boolean;
  length: number;
  max: NumberOfDisplayedItems | Height;
  sx?: SxProps;
}

export function List({
  getListItem,
  length,
  max,
  addPaddingBottom,
  allowHorizontalScrolling,
  alwaysShowHorizontalScrollBar,
  cardVerticalDistance,
  indexToScrollTo,
  leftScrollBar,
  sx,
}: Props): ReactElement {
  const cardHeight = cardVerticalDistance || DEFAULT_CARD_HEIGHT;
  const maxHeight =
    'height' in max ? max.height : max.numberOfDisplayedItems * cardHeight;
  const currentHeight = length * cardHeight;
  const listHeight = alwaysShowHorizontalScrollBar
    ? maxHeight
    : Math.min(currentHeight, maxHeight);
  const scrollOffset = indexToScrollTo
    ? indexToScrollTo * cardHeight < maxHeight / 2
      ? 0
      : indexToScrollTo * cardHeight - maxHeight / 2
    : 0;

  return (
    <MuiBox sx={sx} style={{ maxHeight }}>
      <VirtualizedList
        initialScrollOffset={scrollOffset}
        height={listHeight}
        width={'vertical'}
        itemSize={cardHeight}
        itemCount={length}
        style={{
          direction: `${leftScrollBar ? 'rtl' : 'ltr'}`,
          overflow: `${alwaysShowHorizontalScrollBar ? 'scroll' : 'auto'} ${
            currentHeight < maxHeight ? 'hidden' : 'auto'
          }`,
          paddingBottom: `${addPaddingBottom ? '18px' : '0px'}`,
        }}
      >
        {({
          index,
          style,
        }: {
          index: number;
          style: CSSProperties;
        }): ReactElement => (
          <MuiBox
            sx={leftScrollBar ? classes.scrollChild : {}}
            style={
              allowHorizontalScrolling
                ? {
                    ...style,
                    minWidth: '100%',
                    width: 'fit-content',
                  }
                : style
            }
          >
            {getListItem(index)}
          </MuiBox>
        )}
      </VirtualizedList>
    </MuiBox>
  );
}
