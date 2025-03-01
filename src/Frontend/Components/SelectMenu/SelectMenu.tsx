// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import { useMemo } from 'react';

import {
  MenuItemContainer,
  StyledCheckIcon,
  StyledMenu,
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

export interface SelectMenuOption {
  faded?: boolean;
  icon?: React.ReactElement<unknown>;
  id: string;
  label: React.ReactNode;
  onAdd?(): void;
  onDelete?(): void;
  selected: boolean;
}

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
  const selectedOptionIds = useMemo(
    () =>
      hideSelected
        ? []
        : options.filter(({ selected }) => selected).map(({ id }) => id),
    [hideSelected, options],
  );
  const visibleOptions = useMemo(
    () =>
      hideSelected ? options.filter(({ selected }) => !selected) : options,
    [hideSelected, options],
  );
  return (
    <StyledMenu
      anchorArrow={anchorArrow}
      anchorEl={anchorEl}
      anchorPosition={anchorPosition}
      onClose={() => setAnchorEl(undefined)}
      open={!!anchorEl}
      width={width}
    >
      {renderVisibleOptions()}
    </StyledMenu>
  );

  function renderVisibleOptions() {
    return visibleOptions.map(
      ({ faded, label, icon, id, selected, onAdd, onDelete }, index) => {
        const isLabelString = typeof label === 'string';
        const toggleSelected = () => {
          if (multiple) {
            selectedOptionIds.includes(id) ? onDelete?.() : onAdd?.();
          } else {
            options.forEach((option) => {
              if (option.id === id) {
                option.onAdd?.();
              } else {
                option.onDelete?.();
              }
            });
            setAnchorEl(undefined);
          }
        };

        return (
          <StyledMenuItem
            key={index}
            aria-selected={selected}
            onClick={isLabelString ? toggleSelected : undefined}
            divider={index + 1 !== visibleOptions.length}
            disableRipple
            faded={faded}
            onKeyDown={
              isLabelString ? undefined : (event) => event.stopPropagation()
            }
          >
            {isLabelString ? (
              <MenuItemContainer>
                <MuiListItemIcon sx={{ minWidth: '19px !important' }}>
                  {icon}
                </MuiListItemIcon>
                <MuiListItemText
                  primary={label}
                  primaryTypographyProps={{ marginTop: '2px' }}
                />
                <StyledCheckIcon visible={selectedOptionIds.includes(id)} />
              </MenuItemContainer>
            ) : (
              label
            )}
          </StyledMenuItem>
        );
      },
    );
  }
};
