// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiMenu from '@material-ui/core/Menu';
import MuiMenuItem from '@material-ui/core/MenuItem';
import MuiMoreVertIcon from '@material-ui/icons/MoreVert';
import MuiButton from '@material-ui/core/Button';
import { useButtonStyles } from '../Button/button-styles';
import clsx from 'clsx';
import MuiListItemIcon from '@material-ui/core/ListItemIcon';
import MuiListItemText from '@material-ui/core/ListItemText';
import DeleteIcon from '@material-ui/icons/Delete';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import UndoIcon from '@material-ui/icons/Undo';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { ButtonText } from '../../enums/enums';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  icon: {
    marginRight: -20,
  },
});

const BUTTON_TITLE_TO_ICON_MAP: {
  [buttonText in ButtonText]?: JSX.Element;
} = {
  [ButtonText.Delete]: <DeleteIcon fontSize="small" />,
  [ButtonText.DeleteGlobally]: <DeleteForeverIcon fontSize="small" />,
  [ButtonText.Undo]: <UndoIcon fontSize="small" />,
  [ButtonText.MarkForReplacement]: (
    <CheckBoxOutlineBlankIcon fontSize="small" />
  ),
  [ButtonText.UnmarkForReplacement]: <CheckBoxIcon fontSize="small" />,
  [ButtonText.ReplaceMarked]: <MergeTypeIcon fontSize="small" />,
};

export interface ContextMenuItem {
  onClick(): void;
  buttonText: ButtonText;
  disabled?: boolean;
  hidden?: boolean;
}

interface ContextMenuProps {
  menuItems: Array<ContextMenuItem>;
}

export function ContextMenu(props: ContextMenuProps): ReactElement | null {
  const buttonClasses = useButtonStyles();
  const iconClasses = useStyles();

  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const isContextMenuOpen = Boolean(anchorElement);

  function handleClose(): void {
    setAnchorElement(null);
  }

  function handleClick(event: React.MouseEvent<HTMLElement>): void {
    setAnchorElement(event.currentTarget);
  }

  const displayedMenuItems = props.menuItems.filter(
    (menuItem) => !menuItem.hidden
  );

  const contextMenuIsDisabled =
    displayedMenuItems.filter((menuItem) => !menuItem.disabled).length === 0;

  return displayedMenuItems ? (
    <>
      <MuiButton
        onClick={handleClick}
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
      <MuiMenu
        open={isContextMenuOpen}
        anchorEl={anchorElement}
        keepMounted
        onClose={handleClose}
      >
        {displayedMenuItems.map((menuItem, idx) => (
          <MuiMenuItem
            key={`contextMenu-option-${idx}`}
            onClick={(): void => {
              handleClose();
              menuItem.onClick();
            }}
            disabled={menuItem.disabled}
            role={'button'}
          >
            <MuiListItemIcon className={iconClasses.icon}>
              {BUTTON_TITLE_TO_ICON_MAP[menuItem.buttonText]}
            </MuiListItemIcon>
            <MuiListItemText primary={menuItem.buttonText} />
          </MuiMenuItem>
        ))}
      </MuiMenu>
    </>
  ) : null;
}
