// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useTheme } from '@mui/material/styles';
import type { ComponentProps } from 'react';

import { borderThin, OpossumColors } from '../../shared-styles';
import { type BaseItem, List } from '../List/List';
import { popupScrollableSectionSx } from '../NotificationPopup/NotificationPopup.style';
import { PACKAGE_CARD_LIST_ITEM_HEIGHT } from '../PackageCard/PackageCard';

export function CardList<ItemType extends BaseItem>(
  props: ComponentProps<typeof List<ItemType>>,
) {
  const theme = useTheme();
  const numberOfCards = Math.max(
    props.totalCount ?? 0,
    props.data?.length ?? 0,
  );
  const height = numberOfCards * PACKAGE_CARD_LIST_ITEM_HEIGHT + 1;

  return (
    <List
      {...props}
      sx={{
        ...popupScrollableSectionSx,
        background: OpossumColors.lightestBlue,
        border: `${borderThin} solid ${theme.palette.divider}`,
        minHeight: Math.min(height, PACKAGE_CARD_LIST_ITEM_HEIGHT + 1),
        height,
        ...props.sx,
      }}
    />
  );
}
