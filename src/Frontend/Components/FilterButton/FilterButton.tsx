// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type { SxProps, Theme } from '@mui/material';
import MuiBadge, { type BadgeProps } from '@mui/material/Badge';
import MuiTooltip from '@mui/material/Tooltip';
import { type CSSProperties, useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import {
  SelectMenu,
  type SelectMenuOption,
  type SelectMenuProps,
} from '../SelectMenu/SelectMenu';
import { ClearMenuIcon, IconButton } from './FilterButton.style';

interface Props extends Pick<
  SelectMenuProps,
  'anchorArrow' | 'anchorPosition'
> {
  options: Array<SelectMenuOption>;
  isActive: boolean;
  onClear?: () => void;
  disabled?: boolean;
  activeIconSx?: SxProps;
  activeBadgeStyle?: CSSProperties;
  badgeColor?: BadgeProps['color'];
  iconSx?: SxProps;
  triggerStyle?: (isActive: boolean) => SxProps<Theme>;
}

export function FilterButton({
  anchorArrow,
  anchorPosition,
  options,
  isActive,
  onClear,
  disabled,
  activeIconSx,
  activeBadgeStyle,
  badgeColor = 'primary',
  iconSx,
  triggerStyle,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const menuOptions = useMemo<Array<SelectMenuOption>>(
    () => [
      ...options,
      ...(isActive && onClear
        ? [
            {
              id: 'clear-filters',
              selected: false,
              label: text.packageLists.clearFilters,
              icon: <ClearMenuIcon />,
              onAdd: onClear,
            },
          ]
        : []),
    ],
    [isActive, onClear, options],
  );

  const content = (
    <MuiBadge
      color={badgeColor}
      variant={'dot'}
      invisible={!isActive}
      anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      slotProps={{
        badge: {
          style: {
            minWidth: '8px',
            width: '8px',
            height: '8px',
            top: '4px',
            right: '4px',
            ...activeBadgeStyle,
          },
        },
      }}
    >
      <MuiTooltip
        title={text.buttons.filter}
        disableInteractive
        placement={'top'}
      >
        <FilterAltIcon sx={isActive ? (activeIconSx ?? iconSx) : iconSx} />
      </MuiTooltip>
    </MuiBadge>
  );

  return (
    <>
      <IconButton
        aria-label={'filter button'}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={!!disabled}
        size={'small'}
        color={isActive ? 'primary' : undefined}
        sx={triggerStyle?.(isActive)}
      >
        {content}
      </IconButton>
      <SelectMenu
        anchorArrow={anchorArrow}
        anchorEl={anchorEl}
        anchorPosition={anchorPosition}
        multiple
        options={menuOptions}
        setAnchorEl={setAnchorEl}
        width={336}
      />
    </>
  );
}
