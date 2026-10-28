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
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      marginThreshold={16}
      sx={{ mt: theme.spacing(anchorArrow ? Sizing.SmallGap : Sizing.Tiny) }}
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
        sx={{ p: 0, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
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
