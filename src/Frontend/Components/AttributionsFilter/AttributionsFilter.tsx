// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { AttributionsFilterType } from '../../enums/enums';
import { SxProps } from '@mui/material';
import { updateActiveFilters } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getActiveFilters } from '../../state/selectors/view-selector';
import { FilterMultiSelect } from '../FilterMultiSelect/FilterMultiSelect';

const FILTERS = [
  AttributionsFilterType.OnlyFollowUp,
  AttributionsFilterType.OnlyFirstParty,
  AttributionsFilterType.HideFirstParty,
  AttributionsFilterType.OnlyNeedsReview,
];

interface AttributionsFilterProps {
  sx?: SxProps;
}

export function AttributionsFilter(
  props: AttributionsFilterProps
): ReactElement {
  const dispatch = useAppDispatch();
  const activeFilters = Array.from(useAppSelector(getActiveFilters));

  const updateFilters = (filter: AttributionsFilterType): void => {
    dispatch(updateActiveFilters(filter));
  };

  return (
    <FilterMultiSelect
      sx={props.sx}
      allFilters={FILTERS}
      activeFilters={activeFilters}
      updateFilters={updateFilters}
    />
  );
}
