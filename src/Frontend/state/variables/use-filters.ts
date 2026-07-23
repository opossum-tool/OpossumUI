// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../../shared/attribution-filters';
import type { SortOption } from '../../Components/SortButton/useSortingOptions';
import { useVariable } from './use-variable';

export const MANUAL_ATTRIBUTION_FILTERS_AUDIT =
  'manual-attribution-filters-audit';
export const MANUAL_ATTRIBUTION_FILTERS_REPORT =
  'manual-attribution-filters-report';
export const EXTERNAL_ATTRIBUTION_FILTERS = 'external-attribution-filters';
export const RESOURCE_TREE_FILTERS = 'resource-tree-filters';

export interface AttributionFilters {
  filters: Array<AttributionFilterKey>;
  search: string;
  valueFilters: AttributionValueFilters;
  sorting: SortOption;
}

export interface ResourceTreeFilters {
  onlyUnreviewedFiles: boolean;
  selectedLicense: string;
}

export const initialAttributionFilters: AttributionFilters = {
  filters: [],
  search: '',
  valueFilters: {},
  sorting: 'alphabetically',
};

const initialResourceTreeFilters: ResourceTreeFilters = {
  onlyUnreviewedFiles: false,
  selectedLicense: '',
};

export type UseAttributionFilters = typeof useManualAttributionFilters;

export function useManualAttributionFilters() {
  return useVariable<AttributionFilters>(
    MANUAL_ATTRIBUTION_FILTERS_AUDIT,
    structuredClone(initialAttributionFilters),
  );
}

export function useAttributionFiltersInReportView() {
  return useVariable<AttributionFilters>(
    MANUAL_ATTRIBUTION_FILTERS_REPORT,
    structuredClone(initialAttributionFilters),
  );
}

export function useExternalAttributionFilters() {
  return useVariable<AttributionFilters>(
    EXTERNAL_ATTRIBUTION_FILTERS,
    structuredClone(initialAttributionFilters),
  );
}

export function useResourceTreeFilters() {
  return useVariable<ResourceTreeFilters>(
    RESOURCE_TREE_FILTERS,
    structuredClone(initialResourceTreeFilters),
  );
}
