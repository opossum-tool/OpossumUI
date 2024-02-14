// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import { SxProps } from '@mui/system';
import { defer } from 'lodash';
import { useEffect, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { notInTests } from '../../util/not-in-tests';

const NUMBER_OF_OVERSCROLL_ITEMS = 10;

const StyledVirtuoso = styled(Virtuoso)({
  '& > [data-viewport-type]': { width: 'unset !important', minWidth: '100%' },
});

type Props = {
  cardHeight: number;
  getListItem(index: number): React.ReactElement | null;
  indexToScrollTo?: number;
  length: number;
  minNumberOfItems?: number;
  divider?: boolean;
  sx?: SxProps;
} & (
  | { maxHeight?: number | string; maxNumberOfItems?: never }
  | { maxHeight?: never; maxNumberOfItems?: number }
);

export function List({
  cardHeight,
  getListItem,
  indexToScrollTo = 0,
  length,
  minNumberOfItems,
  divider,
  sx,
  ...props
}: Props) {
  const effectiveCardHeight = divider ? cardHeight + 1 : cardHeight;
  const ref = useRef<VirtuosoHandle>(null);
  const maxHeight = ((): number | string | undefined => {
    if ('maxHeight' in props) {
      return props.maxHeight;
    }
    if ('maxNumberOfItems' in props && props.maxNumberOfItems) {
      return props.maxNumberOfItems * effectiveCardHeight;
    }
    return undefined;
  })();
  const currentHeight = length * effectiveCardHeight;

  useEffect(() => {
    if (indexToScrollTo >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: indexToScrollTo,
          align: 'center',
        }),
      );
    }
  }, [indexToScrollTo]);

  return (
    <StyledVirtuoso
      ref={ref}
      defaultItemHeight={effectiveCardHeight}
      // https://github.com/petyosi/react-virtuoso/issues/1001
      initialTopMostItemIndex={notInTests(
        ~indexToScrollTo && {
          index: indexToScrollTo,
          behavior: 'auto',
          align: 'center',
        },
      )}
      totalCount={length}
      sx={{
        ...sx,
        maxHeight,
        minHeight: minNumberOfItems
          ? Math.min(
              minNumberOfItems,
              props.maxNumberOfItems ?? minNumberOfItems,
            ) * effectiveCardHeight
          : undefined,
        overflowX: 'auto',
        overflowY:
          typeof maxHeight === 'number' && currentHeight < maxHeight
            ? 'hidden'
            : 'auto',
      }}
      increaseViewportBy={effectiveCardHeight * NUMBER_OF_OVERSCROLL_ITEMS}
      itemContent={(index) => (
        <MuiBox sx={{ height: effectiveCardHeight }}>
          {getListItem(index)}
          {divider ? <MuiDivider /> : null}
        </MuiBox>
      )}
    />
  );
}
