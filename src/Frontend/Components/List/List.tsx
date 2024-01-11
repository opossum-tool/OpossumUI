// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { defer } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

const NUMBER_OF_OVERSCROLL_ITEMS = 10;

const classes = {
  scrollChild: {
    direction: 'ltr',
  },
};

type Props = {
  cardHeight: number;
  fullHeight?: boolean;
  getListItem(
    index: number,
    props: { isScrolling: boolean },
  ): React.ReactElement | null;
  indexToScrollTo?: number;
  leftScrollBar?: boolean;
  length: number;
  minNumberOfItems?: number;
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
  minNumberOfItems,
  ...props
}: Props) {
  const ref = useRef<VirtuosoHandle>(null);
  const [isScrolling, setIsScrolling] = useState(false);
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

  useEffect(() => {
    if (indexToScrollTo > 0) {
      defer(
        () =>
          ref.current?.scrollToIndex({
            index: indexToScrollTo,
            align: 'center',
            behavior: 'smooth',
          }),
      );
    }
  }, [indexToScrollTo]);

  return (
    <Virtuoso
      ref={ref}
      fixedItemHeight={cardHeight}
      initialTopMostItemIndex={
        window?.process?.env.JEST_WORKER_ID // https://github.com/petyosi/react-virtuoso/issues/1001
          ? undefined
          : {
              index: indexToScrollTo,
              behavior: 'auto',
              align: 'center',
            }
      }
      totalCount={length}
      isScrolling={setIsScrolling}
      style={{
        height: fullHeight ? '100%' : currentHeight,
        maxHeight,
        minHeight: minNumberOfItems
          ? Math.min(
              minNumberOfItems,
              props.maxNumberOfItems ?? minNumberOfItems,
            ) * cardHeight
          : undefined,
        direction: leftScrollBar ? 'rtl' : 'ltr',
        overflowX: 'auto',
        overflowY: maxHeight && currentHeight < maxHeight ? 'hidden' : 'auto',
      }}
      overscan={cardHeight * NUMBER_OF_OVERSCROLL_ITEMS}
      itemContent={(index) => (
        <MuiBox
          sx={{
            ...(leftScrollBar && classes.scrollChild),
            height: cardHeight,
          }}
        >
          {getListItem(index, { isScrolling })}
        </MuiBox>
      )}
    />
  );
}
