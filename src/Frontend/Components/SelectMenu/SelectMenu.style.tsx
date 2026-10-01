// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import MuiBox from '@mui/material/Box';
import MuiMenu, { type MenuProps as MuiMenuProps } from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { styled, useTheme } from '@mui/material/styles';

import { checkIconSize, OpossumColors, Sizing } from '../../shared-styles';

export const StyledMenu = styled(
  ({
    anchorArrow,
    anchorPosition,
    width,
    ...props
  }: Omit<
    MuiMenuProps,
    | 'anchorPosition'
    | 'anchorOrigin'
    | 'transformOrigin'
    | 'elevation'
    | 'slotProps'
  > & {
    anchorArrow?: boolean;
    anchorPosition: 'left' | 'right' | 'center';
    width?: string | number;
  }) => {
    const theme = useTheme();

    return (
      <MuiMenu
        elevation={0}
        transformOrigin={{ horizontal: anchorPosition, vertical: 'top' }}
        anchorOrigin={{ horizontal: anchorPosition, vertical: 'bottom' }}
        slotProps={{
          list: {
            variant: 'menu' as const,
            sx: { padding: 0, overflow: 'hidden' },
          },
          paper: {
            elevation: 2,
            sx: {
              width,
              ...(anchorArrow && {
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
              }),
            },
          },
        }}
        {...props}
      />
    );
  },
)(({ theme, anchorArrow }) => ({
  marginTop: theme.spacing(anchorArrow ? Sizing.SmallGap : Sizing.Tiny),
}));

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
  // 4.25 units = 17px right padding for the check icon
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  paddingRight: theme.spacing(4.25),
  paddingLeft: theme.spacing(Sizing.MediumPad),
  // 9.5 units = 38px, matches the menu item row height
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  height: theme.spacing(9.5),
  width: '100%',
}));
