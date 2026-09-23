// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useTheme } from '@mui/material/styles';
import type { ComponentProps } from 'react';

import { OpossumColors } from '../../shared-styles';
import { type BaseItem, List } from '../List/List';
import { PACKAGE_CARD_LIST_ITEM_HEIGHT } from '../PackageCard/PackageCard';

const MAX_NUMBER_OF_CARDS = 4;
const BORDER_WIDTH_IN_THEME_UNITS = 0.25;

export function CardList<ItemType extends BaseItem>({
  fillAvailableHeight = false,
  ...props
}: ComponentProps<typeof List<ItemType>> & {
  fillAvailableHeight?: boolean;
}) {
  const theme = useTheme();
  const height =
    Math.min(MAX_NUMBER_OF_CARDS, props.data?.length ?? 0) *
      PACKAGE_CARD_LIST_ITEM_HEIGHT +
    1;

  return (
    <List
      {...props}
      sx={{
        background: OpossumColors.lightestBlue,
        border: `${theme.spacing(BORDER_WIDTH_IN_THEME_UNITS)} solid ${theme.palette.divider}`,
        boxSizing: 'border-box',
        maxHeight: height,
        minHeight: height,
        height,
        ...(fillAvailableHeight && {
          flex: 1,
          minHeight: 0,
          maxHeight: 'none',
          height: 'auto',
        }),
        ...props.sx,
      }}
    />
  );
}
