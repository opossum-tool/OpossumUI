// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions } from '../../../shared/shared-types';
import { Filter, FilterCounts } from '../../shared-constants';
import { useVariable } from './use-variable';

export const FILTERED_ATTRIBUTIONS = 'filtered-attributions';

export interface FilteredAttributions {
  attributions: Attributions;
  counts: FilterCounts | null;
  loading: boolean;
  search: string;
  selectedFilters: Array<Filter>;
}

export const initialFilteredAttributions: FilteredAttributions = {
  selectedFilters: [],
  attributions: {},
  counts: null,
  loading: false,
  search: '',
};

export function useFilteredAttributions() {
  const [filteredAttributions, setFilteredAttributions] =
    useVariable<FilteredAttributions>(
      FILTERED_ATTRIBUTIONS,
      initialFilteredAttributions,
    );

  return [
    {
      ...filteredAttributions,
      attributionIds: Object.keys(filteredAttributions.attributions),
    },
    setFilteredAttributions,
  ] as const;
}
