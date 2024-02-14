// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { Filter, FilterCounts, Sorting } from '../../shared-constants';
import { useAppSelector } from '../hooks';
import { getSelectedAttributionId } from '../selectors/resource-selectors';
import { useVariable } from './use-variable';

export const FILTERED_ATTRIBUTIONS = 'filtered-attributions';
export const FILTERED_SIGNALS = 'filtered-signals';

export interface FilteredData {
  attributions: Attributions;
  counts: FilterCounts | null;
  filters: Array<Filter>;
  loading: boolean;
  search: string;
  selectFirstAttribution?: boolean;
  selectedLicense: string;
  sorting: Sorting;
}

export const initialFilteredAttributions: FilteredData = {
  filters: [],
  attributions: {},
  counts: null,
  loading: false,
  search: '',
  selectedLicense: '',
  sorting: text.sortings.name,
};

export const initialFilteredSignals: FilteredData = {
  filters: [],
  attributions: {},
  counts: null,
  loading: false,
  search: '',
  selectedLicense: '',
  sorting: text.sortings.occurrence,
};

export type UseFilteredData = typeof useFilteredAttributions;

export function useFilteredAttributions() {
  return useVariable<FilteredData>(
    FILTERED_ATTRIBUTIONS,
    initialFilteredAttributions,
  );
}

export function useFilteredSignals() {
  return useVariable<FilteredData>(FILTERED_SIGNALS, initialFilteredSignals);
}

export function useIsSelectedAttributionVisible() {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const [{ attributions }] = useFilteredAttributions();
  const [{ attributions: signals }] = useFilteredSignals();

  return (
    selectedAttributionId in attributions || selectedAttributionId in signals
  );
}
