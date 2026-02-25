// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import SortIcon from '@mui/icons-material/Sort';
import MuiBadge from '@mui/material/Badge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import { UseFilteredData } from '../../state/variables/use-filtered-data';
import {
  SelectMenu,
  SelectMenuOption,
  SelectMenuProps,
} from '../SelectMenu/SelectMenu';
import { SortOption, useSortConfiguration } from './useSortingOptions';

interface Props extends Pick<
  SelectMenuProps,
  'anchorArrow' | 'anchorPosition'
> {
  useFilteredData: UseFilteredData;
  disabled?: boolean;
}

export const SortButton: React.FC<Props> = ({
  useFilteredData,
  anchorArrow,
  anchorPosition,
  disabled,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [{ sorting }, setFilteredAttributions] = useFilteredData();

  const sortConfiguration = useSortConfiguration();

  const setSorting = useCallback(
    (sortOption: SortOption) => {
      setFilteredAttributions((prev) => ({
        ...prev,
        sorting: sortOption,
      }));
    },
    [setFilteredAttributions],
  );

  const isCurrentSortingActive = sortConfiguration[sorting].active;

  useEffect(() => {
    if (!isCurrentSortingActive) {
      setSorting('alphabetically');
    }
  }, [isCurrentSortingActive, setSorting]);

  const sortingOptions = useMemo(
    () =>
      Object.entries(sortConfiguration)
        .filter(([_, entry]) => entry.active)
        .map<SelectMenuOption>(([key, entry]) => {
          const Icon = entry.icon;
          const sortOption: SortOption = key as SortOption;
          return {
            id: sortOption,
            label: entry.label,
            selected: sortOption === sorting,
            icon: <Icon />,
            onAdd: () => setSorting(sortOption),
          };
        }),
    [sorting, sortConfiguration, setSorting],
  );

  const BadgeContent = sortConfiguration[sorting].icon;

  return (
    <>
      <MuiIconButton
        aria-label={'sort button'}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={disabled}
        size={'small'}
      >
        <MuiBadge
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          invisible={disabled}
          slotProps={{
            badge: {
              style: {
                padding: 0,
                minWidth: 'unset',
                width: 'fit-content',
                height: 'fit-content',
              },
            },
          }}
          badgeContent={<BadgeContent color={'action'} />}
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
        width={200}
      />
    </>
  );
};
