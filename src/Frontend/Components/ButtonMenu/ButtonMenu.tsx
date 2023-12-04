// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiMenu, { MenuProps as MuiMenuProps } from '@mui/material/Menu';
import { styled } from '@mui/material/styles';

export const ButtonMenu = styled(
  ({ minWidth, ...props }: MuiMenuProps & { minWidth?: number }) => (
    <MuiMenu
      elevation={0}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      {...props}
    />
  ),
)(({ minWidth }) => ({
  '& .MuiPaper-root': {
    borderRadius: '4px',
    marginTop: '-4px',
    minWidth,
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
  },
}));
