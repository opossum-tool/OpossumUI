// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import { SxProps } from '@mui/system';
import { useMemo, useState } from 'react';

import {
  StyledCheckIcon,
  StyledMenu,
  StyledMenuItem,
} from './SelectMenu.style';

export interface SelectMenuProps {
  anchorEl: HTMLElement | undefined;
  hideSelected?: boolean;
  horizontal?: 'left' | 'right' | 'center';
  multiple?: boolean;
  options: Array<SelectMenuOption>;
  setAnchorEl: (anchorEl: HTMLElement | undefined) => void;
  sx?: SxProps;
}

export interface SelectMenuOption {
  selected: boolean;
  icon?: React.ReactElement;
  id: string;
  label: React.ReactNode;
  onAdd?(): void;
  onDelete?(): void;
}

export const SelectMenu: React.FC<SelectMenuProps> = ({
  anchorEl,
  hideSelected,
  horizontal = 'center',
  multiple,
  options,
  setAnchorEl,
  sx,
}) => {
  const [pendingOptionIds, setPendingOptionIds] = useState<Array<string>>(
    hideSelected
      ? []
      : options.filter(({ selected }) => selected).map(({ id }) => id),
  );
  const visibleOptions = useMemo(
    () =>
      hideSelected ? options.filter(({ selected }) => !selected) : options,
    [hideSelected, options],
  );
  const handleClose = () => {
    setAnchorEl(undefined);

    if (hideSelected) {
      pendingOptionIds.forEach((id) => {
        options.find((option) => option.id === id)?.onAdd?.();
      });
      setPendingOptionIds([]);
    } else {
      options.forEach(({ selected, id, onAdd, onDelete }) => {
        if (selected && !pendingOptionIds.includes(id)) {
          onDelete?.();
        } else if (!selected && pendingOptionIds.includes(id)) {
          onAdd?.();
        }
      });
    }
  };

  return (
    <StyledMenu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={handleClose}
      horizontal={horizontal}
      sx={sx}
    >
      {renderVisibleOptions()}
    </StyledMenu>
  );

  function renderVisibleOptions() {
    return visibleOptions.map(({ label, icon, id, selected }, index) => (
      <StyledMenuItem
        aria-selected={selected}
        key={index}
        onClick={() => {
          if (multiple) {
            setPendingOptionIds((prev) =>
              prev.includes(id)
                ? prev.filter((value) => value !== id)
                : prev.concat(id),
            );
          } else {
            setPendingOptionIds([id]);
            options.forEach((option) => {
              if (option.id === id) {
                option.onAdd?.();
              } else {
                option.onDelete?.();
              }
            });
            setAnchorEl(undefined);
          }
        }}
        divider={index + 1 !== visibleOptions.length}
        disableRipple
      >
        <MuiListItemIcon>{icon}</MuiListItemIcon>
        <MuiListItemText
          primary={label}
          primaryTypographyProps={{ sx: { marginTop: '3px' } }}
        />
        <StyledCheckIcon
          visibility={pendingOptionIds.includes(id) ? 'visible' : 'hidden'}
        />
      </StyledMenuItem>
    ));
  }
};
