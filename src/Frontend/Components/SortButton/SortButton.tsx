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
import { Sorting, SORTINGS } from '../../shared-constants';
import { UseFilteredData } from '../../state/variables/use-filtered-data';
import {
  SelectMenu,
  SelectMenuOption,
  SelectMenuProps,
} from '../SelectMenu/SelectMenu';

const SORT_ICONS: Record<
  Sorting,
  React.FC<{ color?: 'action' | 'disabled' }>
> = {
  [text.sortings.name]: ({ color }) => (
    <SortByAlphaIcon color={color || 'action'} fontSize={'inherit'} />
  ),
  [text.sortings.criticality]: ({ color }) => (
    <WhatshotIcon color={color || 'warning'} fontSize={'inherit'} />
  ),
  [text.sortings.occurrence]: ({ color }) => (
    <BarChartIcon color={color || 'info'} fontSize={'inherit'} />
  ),
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
      SORTINGS.map<SelectMenuOption>((option) => {
        const Icon = SORT_ICONS[option];

        return {
          id: option,
          label: option,
          selected: option === sorting,
          icon: <Icon />,
          onAdd: () =>
            setFilteredAttributions((prev) => ({
              ...prev,
              sorting: option,
            })),
        };
      }),
    [setFilteredAttributions, sorting],
  );

  const disabled = !attributions || !Object.keys(attributions).length;
  const BadgeContent = SORT_ICONS[sorting];

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
          componentsProps={{
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
      />
    </>
  );
};
