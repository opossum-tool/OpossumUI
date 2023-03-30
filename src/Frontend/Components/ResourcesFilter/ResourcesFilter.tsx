// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ResourcesFilterType } from '../../enums/enums';
import { SxProps } from '@mui/material';
import { FilterMultiSelect } from '../FilterMultiSelect/FilterMultiSelect';

const FILTERS = [ResourcesFilterType.HideAttributed];

interface ResourcesFilterProps {
  activeFilters: Array<ResourcesFilterType>;
  updateFilters(filter: ResourcesFilterType): void;
  sx?: SxProps;
}

export function ResourcesFilter(props: ResourcesFilterProps): ReactElement {
  return (
    <FilterMultiSelect
      sx={props.sx}
      allFilters={FILTERS}
      activeFilters={props.activeFilters}
      updateFilters={props.updateFilters}
    />
  );
}
