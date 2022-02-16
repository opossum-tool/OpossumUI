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
import { FilterType } from '../../enums/enums';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { updateActiveFilters } from '../../state/actions/view-actions/view-actions';
import { getActiveFilters } from '../../state/selectors/view-selector';
import { makeStyles } from '@mui/styles';
import { OpossumColors } from '../../shared-styles';
import clsx from 'clsx';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const FILTERS = [
  FilterType.OnlyFollowUp,
  FilterType.OnlyFirstParty,
  FilterType.HideFirstParty,
];

const useStyles = makeStyles({
  dropDownForm: {
    margin: '12px 0px 8px 0px',
    backgroundColor: OpossumColors.white,
    '& fieldset': {
      borderRadius: 0,
    },
    '& label': {
      backgroundColor: OpossumColors.white,
      padding: 1,
    },
  },
  dropDownSelect: {
    minHeight: 36,
    '& svg': {
      paddingRight: 6,
    },
  },
  dropDownBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0.5,
  },
  chip: {
    maxHeight: 19,
    fontSize: 12,
  },
  dropdownStyle: {
    maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    left: '7px !important',
  },
});

interface FilterMultiSelectProps {
  className?: string;
}

export function FilterMultiSelect(props: FilterMultiSelectProps): ReactElement {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const activeFilters = Array.from(useAppSelector(getActiveFilters));

  const updateFilters = (filter: FilterType): void => {
    dispatch(updateActiveFilters(filter));
  };

  function getMenuItems(): Array<ReactElement> {
    return FILTERS.map((filter) => (
      <MuiMenuItem
        dense
        aria-label={filter}
        key={filter}
        value={filter}
        onClick={(event): void => {
          updateFilters(event.currentTarget.textContent as FilterType);
        }}
      >
        {filter}
      </MuiMenuItem>
    ));
  }

  return (
    <MuiFormControl
      className={clsx(classes.dropDownForm, props.className)}
      size="small"
      fullWidth
    >
      <MuiInputLabel>Filter</MuiInputLabel>
      <MuiSelect
        className={classes.dropDownSelect}
        data-testid="test-id-filter-multi-select"
        multiple
        value={activeFilters}
        input={<MuiOutlinedInput />}
        renderValue={(selectedFilters): ReactElement => (
          <MuiBox className={classes.dropDownBox}>
            {selectedFilters.map((filter) => (
              <MuiChip
                key={filter}
                label={filter}
                size="small"
                className={classes.chip}
                onMouseDown={(event): void => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDelete={(): void => {
                  updateFilters(filter);
                }}
              />
            ))}
          </MuiBox>
        )}
        MenuProps={{ classes: { paper: classes.dropdownStyle } }}
      >
        {getMenuItems()}
      </MuiSelect>
    </MuiFormControl>
  );
}
