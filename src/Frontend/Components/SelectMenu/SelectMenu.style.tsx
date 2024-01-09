// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import MuiMenu, { MenuProps as MuiMenuProps } from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';

import { shouldNotBeCalled } from '../../util/should-not-be-called';

export const StyledMenu = styled(
  ({
    horizontal,
    sx,
    ...props
  }: MuiMenuProps & { horizontal: 'left' | 'right' | 'center' }) => (
    <MuiMenu
      elevation={0}
      transformOrigin={{ horizontal, vertical: 'top' }}
      anchorOrigin={{ horizontal, vertical: 'bottom' }}
      MenuListProps={{ variant: 'menu', sx: { padding: 0 } }}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            marginTop: '4px',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: (() => {
                switch (horizontal) {
                  case 'left':
                    return '24px';
                  case 'right':
                    return 'calc(100% - 24px)';
                  case 'center':
                    return '50%';
                  default:
                    return shouldNotBeCalled(horizontal);
                }
              })(),
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
            ...sx,
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
