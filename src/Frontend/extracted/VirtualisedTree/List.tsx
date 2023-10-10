// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { CSSProperties, ReactElement } from 'react';
import { FixedSizeList as VirtualizedList } from 'react-window';
import MuiBox from '@mui/material/Box';
import { HeightForTree, NumberOfDisplayedNodesForTree } from './types';
import { SxProps } from '@mui/material';

const DEFAULT_CARD_HEIGHT = 24;

const classes = {
  scrollChild: {
    direction: 'ltr',
  },
};

interface ListProps {
  length: number;
  max: NumberOfDisplayedNodesForTree | HeightForTree;
  getListItem(index: number): ReactElement | null;
  cardVerticalDistance?: number;
  alwaysShowHorizontalScrollBar?: boolean;
  sx?: SxProps;
  indexToScrollTo?: number;
}

function maxHeightWasGiven(
  max: NumberOfDisplayedNodesForTree | HeightForTree,
): max is HeightForTree {
  return Boolean((max as HeightForTree).height);
}

export function List(props: ListProps): ReactElement {
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
    <MuiBox sx={props.sx} style={{ maxHeight: currentHeight }}>
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
          <MuiBox sx={classes.scrollChild} style={style}>
            {props.getListItem(index)}
          </MuiBox>
        )}
      </VirtualizedList>
    </MuiBox>
  );
}
