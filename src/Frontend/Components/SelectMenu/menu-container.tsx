// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuList, Popover } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Sizing } from '../../shared-styles';
import { getMenuPaperStyles } from './SelectMenu.style';

interface Props {
  anchorEl: HTMLElement | undefined;
  onClose: () => void;
  anchorArrow?: boolean;
  anchorPosition?: 'left' | 'right' | 'center';
  width?: string | number;
  children: React.ReactNode;
  adjacentContent?: React.ReactNode;
}

export function MenuContainer({
  anchorEl,
  onClose,
  anchorArrow,
  anchorPosition = 'center',
  width,
  children,
  adjacentContent,
}: Props) {
  const theme = useTheme();
  const menuOffset = theme.spacing(anchorArrow ? Sizing.SmallGap : Sizing.Tiny);
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      marginThreshold={parseFloat(theme.spacing(Sizing.Large))}
      sx={{ mt: menuOffset }}
      anchorOrigin={{ horizontal: anchorPosition, vertical: 'bottom' }}
      transformOrigin={{ horizontal: anchorPosition, vertical: 'top' }}
      slotProps={{
        paper: {
          elevation: 2,
          sx: {
            width,
            overflow: 'visible',
            ...getMenuPaperStyles(theme, anchorPosition, anchorArrow),
          },
        },
      }}
    >
      <MenuList
        autoFocusItem
        variant="menu"
        sx={{
          p: 0,
          maxHeight: `calc(100vh - ${theme.spacing(2 * Sizing.Large)} - ${menuOffset})`,
          overflowY: 'auto',
        }}
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault();
            onClose();
          }
        }}
      >
        {children}
      </MenuList>
      {adjacentContent}
    </Popover>
  );
}
