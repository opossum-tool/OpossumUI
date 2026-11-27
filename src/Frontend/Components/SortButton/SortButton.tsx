// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import SortIcon from '@mui/icons-material/Sort';
import MuiBadge from '@mui/material/Badge';
import MuiIconButton from '@mui/material/IconButton';
import { type SxProps, type Theme, useTheme } from '@mui/material/styles';
import MuiTooltip from '@mui/material/Tooltip';
import { useEffect, useMemo, useState } from 'react';

import type { SortOption } from '../../../shared/attribution-result-set';
import { text } from '../../../shared/text';
import { Sizing } from '../../shared-styles';
import {
  SelectMenu,
  type SelectMenuOption,
  type SelectMenuProps,
} from '../SelectMenu/SelectMenu';
import { useSortConfiguration } from './useSortingOptions';

const badgeStyle = {
  padding: 0,
  minWidth: 'unset',
  width: 'fit-content',
  height: 'fit-content',
};

interface Props extends Pick<
  SelectMenuProps,
  'anchorArrow' | 'anchorPosition'
> {
  sorting: SortOption;
  color?: 'default' | 'inherit';
  badgeInset?: Sizing;
  buttonSx?: SxProps<Theme>;
  disabled?: boolean;
  onSortingChange: (sorting: SortOption) => void;
}

export const SortButton: React.FC<Props> = ({
  sorting,
  color = 'default',
  badgeInset,
  buttonSx,
  anchorArrow,
  anchorPosition,
  disabled,
  onSortingChange,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();

  const sortConfiguration = useSortConfiguration();

  const isCurrentSortingActive = sortConfiguration[sorting].active;

  useEffect(() => {
    if (!isCurrentSortingActive) {
      onSortingChange('alphabetically');
    }
  }, [isCurrentSortingActive, onSortingChange]);

  const sortingOptions = useMemo(
    () =>
      Object.entries(sortConfiguration)
        .filter(([_, entry]) => entry.active)
        .map<SelectMenuOption>(([key, entry]) => {
          const Icon = entry.icon;
          const sortOption: SortOption = key as SortOption;
          return {
            kind: 'toggle' as const,
            id: sortOption,
            label: entry.label,
            selected: sortOption === sorting,
            icon: <Icon />,
            onAdd: () => onSortingChange(sortOption),
          };
        }),
    [sorting, sortConfiguration, onSortingChange],
  );

  const BadgeContent = sortConfiguration[sorting].icon;

  return (
    <>
      <MuiIconButton
        aria-label={'sort button'}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={disabled}
        size={'small'}
        color={color}
        sx={buttonSx}
      >
        <MuiBadge
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          invisible={disabled}
          slotProps={{
            badge: {
              style: {
                ...badgeStyle,
                ...(badgeInset !== undefined && {
                  right: theme.spacing(badgeInset),
                  bottom: theme.spacing(badgeInset),
                }),
              },
            },
          }}
          badgeContent={
            <BadgeContent color={color === 'inherit' ? 'inherit' : 'action'} />
          }
        >
          <MuiTooltip
            title={text.buttons.sort}
            disableInteractive
            placement={'top'}
          >
            <SortIcon />
          </MuiTooltip>
        </MuiBadge>
      </MuiIconButton>
      <SelectMenu
        anchorArrow={anchorArrow}
        anchorEl={anchorEl}
        anchorPosition={anchorPosition}
        options={sortingOptions}
        setAnchorEl={setAnchorEl}
        width={theme.spacing(Sizing.Content)}
      />
    </>
  );
};
