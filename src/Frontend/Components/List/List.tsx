// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';
import { Virtuoso } from 'react-virtuoso';

const classes = {
  scrollChild: {
    direction: 'ltr',
  },
};

type Props = {
  cardHeight: number;
  fullHeight?: boolean;
  getListItem(index: number): ReactElement | null;
  indexToScrollTo?: number;
  leftScrollBar?: boolean;
  length: number;
} & (
  | { maxHeight?: number; maxNumberOfItems?: never }
  | { maxHeight?: never; maxNumberOfItems?: number }
);

export function List({
  cardHeight,
  fullHeight,
  getListItem,
  indexToScrollTo = 0,
  leftScrollBar,
  length,
  ...props
}: Props): ReactElement {
  const maxHeight = ((): number | undefined => {
    if ('maxHeight' in props) {
      return props.maxHeight;
    }
    if ('maxNumberOfItems' in props && props.maxNumberOfItems) {
      return props.maxNumberOfItems * cardHeight;
    }
    return undefined;
  })();
  const currentHeight = length * cardHeight;

  return (
    <Virtuoso
      initialTopMostItemIndex={
        window?.process?.env.JEST_WORKER_ID // https://github.com/petyosi/react-virtuoso/issues/1001
          ? undefined
          : {
              index: indexToScrollTo,
              align: 'center',
            }
      }
      fixedItemHeight={cardHeight}
      totalCount={length}
      style={{
        height: fullHeight ? '100%' : currentHeight,
        maxHeight,
        direction: leftScrollBar ? 'rtl' : 'ltr',
        overflowX: 'auto',
        overflowY: maxHeight && currentHeight < maxHeight ? 'hidden' : 'auto',
      }}
      itemContent={(index): ReactElement => (
        <MuiBox
          sx={{
            ...(leftScrollBar && classes.scrollChild),
            height: cardHeight,
          }}
        >
          {getListItem(index)}
        </MuiBox>
      )}
    />
  );
}
