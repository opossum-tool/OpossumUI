// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type { SxProps, Theme } from '@mui/material';
import MuiBadge, { type BadgeProps } from '@mui/material/Badge';
import { useTheme } from '@mui/material/styles';
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
  onOpenChange?: (open: boolean) => void;
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
  onOpenChange,
  disabled,
  activeIconSx,
  activeBadgeStyle,
  badgeColor = 'primary',
  iconSx,
  triggerStyle,
}: Props) {
  const theme = useTheme();
  const BADGE_SIZE = theme.spacing(2);
  const BADGE_OFFSET = theme.spacing(1);
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const handleSetAnchorEl = (nextAnchorEl: HTMLElement | undefined) => {
    setAnchorEl(nextAnchorEl);
    onOpenChange?.(nextAnchorEl !== undefined);
  };
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
            minWidth: BADGE_SIZE,
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            top: BADGE_OFFSET,
            right: BADGE_OFFSET,
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
        onClick={(event) => handleSetAnchorEl(event.currentTarget)}
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
        setAnchorEl={handleSetAnchorEl}
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 84 theme spacing units (= 336px)
        width={theme.spacing(84)}
      />
    </>
  );
}
