// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';

import { auditingOptionIconSize } from '../../shared-styles';
import { MenuContainer } from './menu-container';
import {
  MenuItemContainer,
  StyledCheckIcon,
  StyledMenuItem,
} from './SelectMenu.style';

export interface SelectMenuProps {
  anchorArrow?: boolean;
  anchorEl: HTMLElement | undefined;
  anchorPosition?: 'left' | 'right' | 'center';
  hideSelected?: boolean;
  multiple?: boolean;
  options: Array<SelectMenuOption>;
  setAnchorEl: (anchorEl: HTMLElement | undefined) => void;
  width?: string | number;
}

interface MenuOptionBase {
  endIcon?: React.ReactNode;
  faded?: boolean;
  icon?: React.ReactElement<unknown>;
  id: string;
  label: React.ReactNode;
  selected: boolean;
}

export interface ToggleMenuOption extends MenuOptionBase {
  kind: 'toggle';
  onAdd?(): void;
  onDelete?(): void;
}
interface EmbeddedMenuOption extends MenuOptionBase {
  kind: 'embedded';
  focusContent?(): void;
}
export interface PanelMenuOption extends MenuOptionBase {
  kind: 'panel';
  submenu: {
    id: string;
    open: boolean;
    onOpen: (anchor: HTMLElement) => void;
    onClose: () => void;
  };
}

export type SelectMenuOption =
  ToggleMenuOption | EmbeddedMenuOption | PanelMenuOption;

export const SelectMenu: React.FC<SelectMenuProps> = ({
  anchorArrow,
  anchorEl,
  anchorPosition = 'center',
  hideSelected,
  multiple,
  options,
  setAnchorEl,
  width,
}) => {
  return (
    <MenuContainer
      anchorArrow={anchorArrow}
      anchorEl={anchorEl}
      anchorPosition={anchorPosition}
      onClose={() => setAnchorEl(undefined)}
      width={width}
    >
      {renderSelectMenuItems({ options, multiple, hideSelected, setAnchorEl })}
    </MenuContainer>
  );
};

export function renderSelectMenuItems({
  options,
  multiple,
  hideSelected,
  setAnchorEl,
  onOptionActivate,
}: { onOptionActivate?: (id: string) => void } & Pick<
  SelectMenuProps,
  'options' | 'multiple' | 'hideSelected' | 'setAnchorEl'
>) {
  const selectedOptionIds = hideSelected
    ? []
    : options.filter(({ selected }) => selected).map(({ id }) => id);
  const visibleOptions = hideSelected
    ? options.filter(({ selected }) => !selected)
    : options;
  return renderVisibleOptions();

  function renderVisibleOptions() {
    return visibleOptions.map((option, index) => {
      const { faded, label, icon, endIcon, id, selected, kind } = option;
      const embedded = kind === 'embedded';
      const submenu = kind === 'panel' ? option.submenu : undefined;
      let onClick: React.MouseEventHandler<HTMLLIElement> | undefined;
      let onKeyDown: React.KeyboardEventHandler<HTMLLIElement> | undefined;
      switch (option.kind) {
        case 'toggle':
          onClick = () => {
            if (multiple) {
              selectedOptionIds.includes(id)
                ? option.onDelete?.()
                : option.onAdd?.();
            } else {
              options.forEach((other) => {
                if (other.kind === 'toggle') {
                  other.id === id ? other.onAdd?.() : other.onDelete?.();
                }
              });
              setAnchorEl(undefined);
            }
          };
          break;
        case 'embedded':
          onClick = option.focusContent;
          onKeyDown = (event) => event.stopPropagation();
          break;
        case 'panel':
          onClick = (event) =>
            option.submenu.open
              ? option.submenu.onClose()
              : option.submenu.onOpen(event.currentTarget);
          onKeyDown = (event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              event.stopPropagation();
              option.submenu.onOpen(event.currentTarget);
            }
          };
          break;
        default: {
          const exhaustive: never = option;
          return exhaustive;
        }
      }

      return (
        <StyledMenuItem
          key={id}
          title={typeof label === 'string' ? label : undefined}
          selected={selected}
          aria-selected={selected}
          aria-haspopup={submenu ? 'dialog' : undefined}
          aria-expanded={submenu?.open}
          aria-controls={submenu?.open ? submenu.id : undefined}
          onClickCapture={() => onOptionActivate?.(id)}
          onClick={onClick}
          divider={index + 1 !== visibleOptions.length}
          disableRipple
          faded={faded}
          onKeyDown={onKeyDown}
        >
          {!embedded ? (
            <MenuItemContainer>
              <MuiListItemIcon
                sx={{
                  minWidth: `${auditingOptionIconSize} !important`,
                }}
              >
                {icon}
              </MuiListItemIcon>
              <MuiListItemText
                primary={label}
                slotProps={{
                  primary: {
                    sx: {
                      mt: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  },
                }}
              />
              {endIcon ?? (
                <StyledCheckIcon visible={selectedOptionIds.includes(id)} />
              )}
            </MenuItemContainer>
          ) : (
            label
          )}
        </StyledMenuItem>
      );
    });
  }
}
