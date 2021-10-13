// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiMoreVertIcon from '@material-ui/icons/MoreVert';
import MuiButton from '@material-ui/core/Button';
import { useButtonStyles } from '../Button/button-styles';
import clsx from 'clsx';
import {
  ContextMenuItem,
  WithContextMenu,
} from '../ContextMenu/WithContextMenu';

interface ContextMenuButtonProps {
  menuItems: Array<ContextMenuItem>;
}

export function ContextMenuButton(
  props: ContextMenuButtonProps
): ReactElement | null {
  const buttonClasses = useButtonStyles();

  const displayedMenuItems = props.menuItems.filter(
    (menuItem) => !menuItem.hidden
  );

  const contextMenuIsDisabled =
    displayedMenuItems.filter((menuItem) => !menuItem.disabled).length === 0;

  return displayedMenuItems ? (
    <>
      <WithContextMenu menuItems={props.menuItems} activation={'onLeftClick'}>
        <MuiButton
          aria-label={'button-context-menu'}
          key={'button-group-context-menu'}
          className={clsx(
            !contextMenuIsDisabled
              ? buttonClasses.light
              : buttonClasses.disabledLight,
            'MuiButtonGroup-grouped MuiButtonGroup-groupedHorizontal'
          )}
          disabled={contextMenuIsDisabled}
        >
          <MuiMoreVertIcon />
        </MuiButton>
      </WithContextMenu>
    </>
  ) : null;
}
