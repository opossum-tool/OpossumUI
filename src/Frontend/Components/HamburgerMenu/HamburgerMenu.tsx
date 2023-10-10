// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiMoreVertIcon from '@mui/icons-material/MoreVert';
import MuiButton from '@mui/material/Button';
import { ContextMenu, ContextMenuItem } from '../ContextMenu/ContextMenu';
import { buttonStyles } from '../Button/button-styles';

interface HamburgerMenuProps {
  menuItems: Array<ContextMenuItem>;
}

export function HamburgerMenu(props: HamburgerMenuProps): ReactElement | null {
  const displayedMenuItems = props.menuItems.filter(
    (menuItem) => !menuItem.hidden,
  );

  const contextMenuIsDisabled =
    displayedMenuItems.filter((menuItem) => !menuItem.disabled).length === 0;

  return displayedMenuItems ? (
    <ContextMenu menuItems={props.menuItems} activation={'onLeftClick'}>
      <MuiButton
        aria-label={'button-hamburger-menu'}
        key={'button-group-hamburger-menu'}
        className={'MuiButtonGroup-grouped MuiButtonGroup-groupedHorizontal'}
        sx={
          !contextMenuIsDisabled
            ? buttonStyles.light
            : buttonStyles.disabledLight
        }
        disabled={contextMenuIsDisabled}
      >
        <MuiMoreVertIcon />
      </MuiButton>
    </ContextMenu>
  ) : null;
}
