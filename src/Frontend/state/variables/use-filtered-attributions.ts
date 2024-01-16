// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { Attributions } from '../../../shared/shared-types';
import {
  Filter,
  FilterCounts,
} from '../../web-workers/scripts/get-filtered-attributions';
import { useAppSelector } from '../hooks';
import { getManualAttributions } from '../selectors/all-views-resource-selectors';
import { useVariable } from './use-variable';

export const FILTERED_ATTRIBUTIONS = 'filtered-attributions';

export interface FilteredAttributions {
  selectedFilters: Array<Filter>;
  attributions: Attributions;
  counts: FilterCounts | null;
  loading: boolean;
  search: string;
}

export const initialFilteredAttributions: FilteredAttributions = {
  selectedFilters: [],
  attributions: {},
  counts: null,
  loading: false,
  search: '',
};

export function useFilteredAttributions() {
  const attributions = useAppSelector(getManualAttributions);
  const [filteredAttributions, setFilteredAttributions] =
    useVariable<FilteredAttributions>(
      FILTERED_ATTRIBUTIONS,
      initialFilteredAttributions,
    );

  useEffect(() => {
    if (!filteredAttributions.selectedFilters.length) {
      setFilteredAttributions((prev) => ({
        ...prev,
        attributions,
      }));
    }
  }, [
    attributions,
    filteredAttributions.selectedFilters.length,
    setFilteredAttributions,
  ]);

  return [filteredAttributions, setFilteredAttributions] as const;
}
