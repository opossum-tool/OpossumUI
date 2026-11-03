// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import MuiBox from '@mui/material/Box';
import MuiMenuItem from '@mui/material/MenuItem';
import { styled, type Theme } from '@mui/material/styles';

import { checkIconSize, OpossumColors, Sizing } from '../../shared-styles';

export const StyledMenuItem = styled(MuiMenuItem, {
  shouldForwardProp: (name: string) => name !== 'faded',
})<{
  faded: boolean | undefined;
}>(({ faded }) => ({
  padding: 0,
  // 0.5: faded menu items are dimmed
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  opacity: faded ? 0.5 : 1,
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: OpossumColors.lightestBlue,
  },
}));

export const StyledCheckIcon = styled(CheckIcon, {
  shouldForwardProp: (name: string) => !['visible'].includes(name),
})<{
  visible: boolean;
}>(({ visible }) => ({
  width: checkIconSize,
  height: checkIconSize,
  visibility: visible ? 'visible' : 'hidden',
}));

export const MenuItemContainer = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(Sizing.SmallGap),
  alignItems: 'center',
  paddingRight: theme.spacing(Sizing.Large),
  paddingLeft: theme.spacing(Sizing.MediumPad),
  paddingTop: theme.spacing(Sizing.SmallGap),
  paddingBottom: theme.spacing(Sizing.SmallGap),
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
}));

export function getMenuPaperStyles(
  theme: Theme,
  anchorPosition: 'left' | 'right' | 'center',
  anchorArrow?: boolean,
) {
  return anchorArrow
    ? {
        overflow: 'visible',
        filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.32))',
        mt: 1,
        '&:before': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: {
            left: theme.spacing(Sizing.Section),
            right: `calc(100% - ${theme.spacing(Sizing.Section)})`,
            center: '50%',
          }[anchorPosition],
          // 2.5 units = 10px arrow size
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          width: theme.spacing(2.5),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          height: theme.spacing(2.5),
          bgcolor: 'background.paper',
          transform: 'translateY(-50%) rotate(45deg)',
        },
      }
    : {};
}
