// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SortOption } from '../../Components/SortButton/useSortingOptions';
import { Filter } from '../../shared-constants';
import { useVariable } from './use-variable';

export const MANUAL_ATTRIBUTION_FILTERS_AUDIT =
  'manual-attribution-filters-audit';
export const MANUAL_ATTRIBUTION_FILTERS_REPORT =
  'manual-attribution-filters-report';
export const EXTERNAL_ATTRIBUTION_FILTERS = 'external-attribution-filters';

export interface AttributionFilters {
  filters: Array<Filter>;
  search: string;
  selectedLicense: string;
  sorting: SortOption;
}

export const initialFilters: AttributionFilters = {
  filters: [],
  search: '',
  selectedLicense: '',
  sorting: 'alphabetically',
};

export type UseAttributionFilters = typeof useManualAttributionFilters;

export function useManualAttributionFilters() {
  return useVariable<AttributionFilters>(
    MANUAL_ATTRIBUTION_FILTERS_AUDIT,
    structuredClone(initialFilters),
  );
}

export function useAttributionFiltersInReportView() {
  return useVariable<AttributionFilters>(
    MANUAL_ATTRIBUTION_FILTERS_REPORT,
    structuredClone(initialFilters),
  );
}

export function useExternalAttributionFilters() {
  return useVariable<AttributionFilters>(
    EXTERNAL_ATTRIBUTION_FILTERS,
    structuredClone(initialFilters),
  );
}
