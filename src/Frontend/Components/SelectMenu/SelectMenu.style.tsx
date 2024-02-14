// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import MuiBox from '@mui/material/Box';
import MuiMenu, { MenuProps as MuiMenuProps } from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';

export const StyledMenu = styled(
  ({
    anchorArrow,
    anchorPosition,
    ...props
  }: Omit<
    MuiMenuProps,
    | 'anchorPosition'
    | 'anchorOrigin'
    | 'transformOrigin'
    | 'elevation'
    | 'slotProps'
    | 'MenuListProps'
  > & {
    anchorArrow?: boolean;
    anchorPosition: 'left' | 'right' | 'center';
  }) => (
    <MuiMenu
      elevation={0}
      transformOrigin={{ horizontal: anchorPosition, vertical: 'top' }}
      anchorOrigin={{ horizontal: anchorPosition, vertical: 'bottom' }}
      MenuListProps={{
        variant: 'menu',
        sx: { padding: 0, overflow: 'hidden' },
      }}
      slotProps={{
        paper: {
          elevation: 2,
          sx: {
            ...(anchorArrow && {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              marginTop: '4px',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: (() => {
                  switch (anchorPosition) {
                    case 'left':
                      return '24px';
                    case 'right':
                      return 'calc(100% - 24px)';
                    case 'center':
                      return '50%';
                  }
                })(),
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
              },
            }),
          },
        },
      }}
      {...props}
    />
  ),
)({});

export const StyledMenuItem = styled(MuiMenuItem)({
  padding: '8px',
});

export const StyledCheckIcon = styled(CheckIcon)<{
  visibility: 'hidden' | 'visible';
}>(({ visibility }) => ({
  width: '20px',
  height: '20px',
  marginLeft: '16px',
  visibility,
}));

export const MenuItemContainer = styled(MuiBox)({
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  paddingRight: '17px',
  paddingLeft: '12px',
  height: '38px',
});
