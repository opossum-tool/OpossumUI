// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UndoIcon from '@mui/icons-material/Undo';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { ButtonText } from '../../enums/enums';
import makeStyles from '@mui/styles/makeStyles';
import { PopoverPosition, PopoverReference } from '@mui/material';
import { OpossumColors } from '../../shared-styles';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';

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
  [ButtonText.ShowResources]: <OpenInBrowserIcon fontSize="small" />,
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
          anchorPosition,
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
            <MuiListItemText sx={{ pl: 2 }} primary={menuItem.buttonText} />
          </MuiMenuItem>
        ))}
      </MuiMenu>
    </>
  ) : null;
}
