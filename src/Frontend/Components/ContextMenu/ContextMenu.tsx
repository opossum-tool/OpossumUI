// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoneIcon from '@mui/icons-material/Done';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { PopoverPosition, PopoverReference } from '@mui/material';
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { ReactElement, useState } from 'react';

import { ButtonText } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';

const classes = {
  icon: {
    marginRight: '-20px',
  },
  menuItem: {
    '&:hover': {
      backgroundColor: OpossumColors.lightBlueOnHover,
    },
  },
};

const BUTTON_TITLE_TO_ICON_MAP: Record<string, React.ReactElement> = {
  [ButtonText.Confirm]: <DoneIcon fontSize="small" />,
  [ButtonText.ConfirmGlobally]: <DoneOutlineIcon fontSize="small" />,
  [ButtonText.DeleteGlobally]: <DeleteIcon fontSize="small" />,
  [ButtonText.Delete]: <DeleteOutlineIcon fontSize="small" />,
  [ButtonText.Hide]: <VisibilityOffIcon fontSize="small" />,
  [ButtonText.ShowResources]: <OpenInBrowserIcon fontSize="small" />,
  [ButtonText.Unhide]: <VisibilityIcon fontSize="small" />,
};

export interface ContextMenuItem {
  onClick(): void;
  buttonText: string;
  disabled?: boolean;
  hidden?: boolean;
}

export type ContextMenuActivation = 'onRightClick' | 'onLeftClick' | 'both';

interface ContextMenuProps {
  menuItems: Array<ContextMenuItem>;
  children: React.ReactNode;
  activation: ContextMenuActivation;
  onClose?(): void;
  onOpen?(): void;
}

interface AnchorAttributes {
  anchorEl?: null | HTMLElement;
  anchorReference?: PopoverReference;
  anchorPosition?: PopoverPosition | undefined;
}

export function ContextMenu(props: ContextMenuProps): ReactElement | null {
  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<
    undefined | PopoverPosition
  >(undefined);

  const displayedMenuItems = props.menuItems.filter(
    (menuItem) => !menuItem.hidden,
  );

  const contextMenuIsDisabled = displayedMenuItems.every(
    ({ disabled }) => disabled,
  );

  const isContextMenuOpen =
    !contextMenuIsDisabled &&
    displayedMenuItems.length > 0 &&
    (Boolean(anchorElement) || Boolean(anchorPosition));

  const anchorAttributes: AnchorAttributes =
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
    if (props.onClose) {
      props.onClose();
    }
    setAnchorPosition(undefined);
    setAnchorElement(null);
  }

  function handleClick(event: React.MouseEvent<HTMLElement>): void {
    if (props.onOpen && displayedMenuItems.length > 0) {
      props.onOpen();
    }
    setAnchorPosition({
      left: event.clientX - 2,
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      top: event.clientY - 4,
    });
    setAnchorElement(event.currentTarget);
  }

  return displayedMenuItems ? (
    <>
      <div
        onClick={clickHandlers.onClick}
        onContextMenu={(event): void => {
          if (isContextMenuOpen) {
            handleClose();
          } else if (clickHandlers.onContextMenu) {
            clickHandlers.onContextMenu(event);
          }
        }}
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
            sx={classes.menuItem}
          >
            <MuiListItemIcon sx={classes.icon}>
              {BUTTON_TITLE_TO_ICON_MAP[menuItem.buttonText]}
            </MuiListItemIcon>
            <MuiListItemText sx={{ pl: 2 }} primary={menuItem.buttonText} />
          </MuiMenuItem>
        ))}
      </MuiMenu>
    </>
  ) : null;
}
