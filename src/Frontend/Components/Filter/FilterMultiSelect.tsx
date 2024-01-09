// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';

import { useVariable } from '../../util/use-variable';
import { Autocomplete } from '../Autocomplete/Autocomplete';
import {
  ACTIVE_FILTERS_REDUX_KEY,
  Filter,
  FILTER_PROPS,
  filters,
} from './FilterMultiSelect.util';

interface Props {
  sx?: SxProps;
  width?: number;
}

export function FilterMultiSelect({ width, sx }: Props) {
  const [activeFilters, setActiveFilters] = useVariable<Array<Filter>>(
    ACTIVE_FILTERS_REDUX_KEY,
    [],
  );

  return (
    <Autocomplete<Filter, true, false, false>
      options={filters}
      optionText={{ primary: (option) => option }}
      multiple
      title={'Filter'}
      value={activeFilters}
      onChange={(_, value) => setActiveFilters(value)}
      renderOptionStartIcon={(option) => FILTER_PROPS[option].icon}
      filterSelectedOptions
      sx={{ ...sx, flex: 'initial', width }}
      aria-label={'attribution filters'}
    />
  );
}
