// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../../shared/attribution-filters';
import type { SortOption } from '../../../shared/attribution-result-set';
import type { LicenseOption } from '../../../shared/shared-types';
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
  valueFilters: Omit<AttributionValueFilters, 'licenseIds'> & {
    license?: Array<LicenseOption>;
  };
  sorting: SortOption;
  /**
   * Ids of the quickfilters currently combined into these filters. Selection
   * is membership-based: entries stay checked while they are part of the
   * active combination, and unchecking recomputes the filters from the
   * remaining ids.
   */
  activeQuickfilterIds?: Array<string>;
}

export interface ResourceTreeFilters {
  onlyUnreviewedFiles: boolean;
  onlyWithAiDeferredAttributions: boolean;
  selectedLicenses: Array<LicenseOption>;
  licenseSearches?: Array<string>;
}

export const initialAttributionFilters: AttributionFilters = {
  filters: [],
  search: '',
  valueFilters: {},
  sorting: 'alphabetically',
};

const initialResourceTreeFilters: ResourceTreeFilters = {
  onlyUnreviewedFiles: false,
  onlyWithAiDeferredAttributions: false,
  selectedLicenses: [],
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

export function toAttributionValueFilters(
  filters: AttributionFilters['valueFilters'],
): AttributionValueFilters {
  const { license, ...rest } = filters;
  return {
    ...rest,
    licenseIds: license?.length
      ? license.map((option) => option.id)
      : undefined,
  };
}

export function hasActiveAttributionFilters({
  filters,
  search,
  valueFilters,
}: AttributionFilters): boolean {
  // The search box of the packages/signal panels filters the list just like
  // the menu filters, so it counts as an active filter (e.g. when deciding
  // whether a quickfilter can be saved).
  return (
    !!filters.length ||
    !!search ||
    Object.values(valueFilters).some((value) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined,
    )
  );
}
