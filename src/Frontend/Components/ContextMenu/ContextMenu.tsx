// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiMenu from '@material-ui/core/Menu';
import MuiMenuItem from '@material-ui/core/MenuItem';
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
import { PopoverPosition, PopoverReference } from '@material-ui/core';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  icon: {
    marginRight: -20,
  },
  menuItem: {
    '&:hover': {
      backgroundColor: OpossumColors.lightBlueOnHover,
    },
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

export type ContextMenuActivation = 'onRightClick' | 'onLeftClick' | 'both';

interface ContextMenuProps {
  menuItems: Array<ContextMenuItem>;
  children: React.ReactNode;
  activation: ContextMenuActivation;
}

interface anchorAttributes {
  anchorEl?: null | HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition | undefined;
}

export function ContextMenu(props: ContextMenuProps): ReactElement | null {
  const iconClasses = useStyles();

  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<
    undefined | PopoverPosition
  >(undefined);

  const displayedMenuItems = props.menuItems.filter(
    (menuItem) => !menuItem.hidden
  );

  const isContextMenuOpen =
    displayedMenuItems.length > 0 &&
    (Boolean(anchorElement) || Boolean(anchorPosition));

  const anchorAttributes: anchorAttributes =
    props.activation === 'onLeftClick'
      ? {
          anchorEl: anchorElement,
        }
      : {
          anchorReference: 'anchorPosition',
          anchorPosition: anchorPosition,
        };

  const clickHandlers =
    props.activation === 'onRightClick'
      ? {
          onContextMenu: handleClick,
        }
      : props.activation === 'onLeftClick'
      ? { onClick: handleClick }
      : { onClick: handleClick, onContextMenu: handleClick };

  function handleClose(): void {
    setAnchorPosition(undefined);
    setAnchorElement(null);
  }

  function handleClick(event: React.MouseEvent<HTMLElement>): void {
    setAnchorPosition({
      left: event.clientX - 2,
      top: event.clientY - 4,
    });
    setAnchorElement(event.currentTarget);
  }

  return displayedMenuItems ? (
    <>
      <div
        onClick={clickHandlers.onClick}
        onContextMenu={clickHandlers.onContextMenu}
      >
        {props.children}
      </div>
      <MuiMenu
        open={isContextMenuOpen}
        onClose={handleClose}
        anchorReference={anchorAttributes.anchorReference}
        anchorEl={anchorAttributes.anchorEl}
        anchorPosition={anchorAttributes.anchorPosition}
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
            className={iconClasses.menuItem}
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
