// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BarChartIcon from '@mui/icons-material/BarChart';
import SortIcon from '@mui/icons-material/Sort';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import MuiBadge from '@mui/material/Badge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import { UseFilteredData } from '../../state/variables/use-filtered-data';
import { ClassificationCIcon } from '../Icons/Icons';
import {
  SelectMenu,
  SelectMenuOption,
  SelectMenuProps,
} from '../SelectMenu/SelectMenu';

interface SortOptionConfiguration {
  label: string;
  icon: React.FC<{ color?: 'action' | 'disabled' }>;
}

export type SortOption =
  | 'alphabetically'
  | 'criticality'
  | 'occurrence'
  | 'classification';

type SortConfiguration = Record<SortOption, SortOptionConfiguration>;

export const SORT_CONFIGURATION: SortConfiguration = {
  alphabetically: {
    label: text.sortings.name,
    icon: ({ color }: { color?: 'action' | 'disabled' }) => (
      <SortByAlphaIcon color={color || 'action'} fontSize={'inherit'} />
    ),
  },
  criticality: {
    label: text.sortings.criticality,
    icon: ({ color }: { color?: 'action' | 'disabled' }) => (
      <WhatshotIcon color={color || 'warning'} fontSize={'inherit'} />
    ),
  },
  occurrence: {
    label: text.sortings.occurrence,
    icon: ({ color }: { color?: 'action' | 'disabled' }) => (
      <BarChartIcon color={color || 'info'} fontSize={'inherit'} />
    ),
  },
  classification: {
    label: text.sortings.classification,
    icon: ({ color }: { color?: 'action' | 'disabled' }) => (
      <ClassificationCIcon color={color || 'warning'} fontSize={'inherit'} />
    ),
  },
};

interface Props
  extends Pick<SelectMenuProps, 'anchorArrow' | 'anchorPosition'> {
  useFilteredData: UseFilteredData;
}

export const SortButton: React.FC<Props> = ({
  useFilteredData,
  anchorArrow,
  anchorPosition,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [{ sorting, attributions }, setFilteredAttributions] =
    useFilteredData();

  const sortingOptions = useMemo(
    () =>
      Object.entries(SORT_CONFIGURATION).map<SelectMenuOption>(
        ([key, entry]) => {
          const Icon = entry.icon;
          const sortOption: SortOption = key as SortOption;
          return {
            id: sortOption,
            label: entry.label,
            selected: sortOption === sorting,
            icon: <Icon />,
            onAdd: () =>
              setFilteredAttributions((prev) => ({
                ...prev,
                sorting: sortOption,
              })),
          };
        },
      ),
    [setFilteredAttributions, sorting],
  );

  const disabled = !attributions || !Object.keys(attributions).length;
  const BadgeContent = SORT_CONFIGURATION[sorting].icon;

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
