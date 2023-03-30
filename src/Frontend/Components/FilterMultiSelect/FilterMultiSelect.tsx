// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiFormControl from '@mui/material/FormControl';
import MuiInputLabel from '@mui/material/InputLabel';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import MuiChip from '@mui/material/Chip';
import MuiBox from '@mui/material/Box';
import MuiOutlinedInput from '@mui/material/OutlinedInput';
import { AttributionsFilterType, ResourcesFilterType } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { SxProps } from '@mui/material';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

const classes = {
  dropDownForm: {
    margin: '12px 0px 8px 0px',
    backgroundColor: OpossumColors.white,
    '& fieldset': {
      borderRadius: '0px',
    },
    '& label': {
      backgroundColor: OpossumColors.white,
      padding: '1px',
    },
  },
  dropDownSelect: {
    minHeight: '36px',
    '& svg': {
      paddingRight: '6px',
    },
  },
  dropDownBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0.5,
  },
  chip: {
    maxHeight: '19px',
    fontSize: 12,
  },
  dropdownStyle: {
    '& paper': {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      maxHeight: `${ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP}px`,
      left: '7px !important',
    },
  },
};

interface FilterMultiSelectProps {
  allFilters: Array<AttributionsFilterType | ResourcesFilterType>;
  activeFilters: Array<AttributionsFilterType | ResourcesFilterType>;
  updateFilters(filter: AttributionsFilterType | ResourcesFilterType): void;
  sx?: SxProps;
}

export function FilterMultiSelect(props: FilterMultiSelectProps): ReactElement {
  function getMenuItems(): Array<ReactElement> {
    return props.allFilters.map((filter) => (
      <MuiMenuItem
        dense
        aria-label={filter}
        key={filter}
        value={filter}
        onClick={(event): void => {
          props.updateFilters(
            event.currentTarget.textContent as
              | AttributionsFilterType
              | ResourcesFilterType
          );
        }}
      >
        {filter}
      </MuiMenuItem>
    ));
  }

  return (
    <MuiFormControl
      sx={getSxFromPropsAndClasses({
        styleClass: classes.dropDownForm,
        sxProps: props.sx,
      })}
      size="small"
      fullWidth
    >
      <MuiInputLabel>Filter</MuiInputLabel>
      <MuiSelect
        sx={classes.dropDownSelect}
        data-testid="test-id-filter-multi-select"
        multiple
        value={props.activeFilters}
        input={<MuiOutlinedInput />}
        renderValue={(selectedFilters): ReactElement => (
          <MuiBox sx={classes.dropDownBox}>
            {selectedFilters.map((filter) => (
              <MuiChip
                key={filter}
                label={filter}
                size="small"
                sx={classes.chip}
                onMouseDown={(event): void => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDelete={(): void => {
                  props.updateFilters(filter);
                }}
              />
            ))}
          </MuiBox>
        )}
        MenuProps={{ sx: classes.dropdownStyle }}
      >
        {getMenuItems()}
      </MuiSelect>
    </MuiFormControl>
  );
}
