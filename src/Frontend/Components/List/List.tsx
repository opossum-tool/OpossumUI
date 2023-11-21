// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
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
  ): ReactElement | null;
  indexToScrollTo?: number;
  leftScrollBar?: boolean;
  length: number;
  placeholder?: React.ReactElement;
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
    if (indexToScrollTo && ref.current) {
      ref.current.scrollToIndex({
        index: indexToScrollTo,
        align: 'center',
        behavior: 'smooth',
      });
    }
  }, [indexToScrollTo]);

  return (
    <Virtuoso
      ref={ref}
      fixedItemHeight={cardHeight}
      totalCount={length}
      isScrolling={setIsScrolling}
      style={{
        height: fullHeight ? '100%' : currentHeight,
        maxHeight,
        direction: leftScrollBar ? 'rtl' : 'ltr',
        overflowX: 'auto',
        overflowY: maxHeight && currentHeight < maxHeight ? 'hidden' : 'auto',
      }}
      overscan={cardHeight * NUMBER_OF_OVERSCROLL_ITEMS}
      itemContent={(index): ReactElement => (
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
