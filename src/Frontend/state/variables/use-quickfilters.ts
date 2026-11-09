// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { v4 as uuid4 } from 'uuid';

import type {
  LicenseOption,
  QuickfilterScope,
  SavedQuickfilter,
} from '../../../shared/shared-types';
import {
  type AttributionFilters,
  initialAttributionFilters,
} from './use-filters';
import { useUserSettings } from './use-user-setting';

export const MAX_RECENT_QUICKFILTERS = 3;

function toQuickfilterFilters({
  filters,
  search,
  valueFilters,
}: AttributionFilters): SavedQuickfilter['filters'] {
  return {
    filters: [...filters],
    search,
    valueFilters: structuredClone(valueFilters),
  };
}

function scalarValuesCompatible(
  current: number | string | undefined,
  incoming: number | string | undefined,
): boolean {
  return (
    current === undefined || incoming === undefined || current === incoming
  );
}

/**
 * Whether a quickfilter can be merged into the given filters. Scalar fields
 * (search text, classification, criticality, incomplete coordinates/legal)
 * can hold only one value, so two different values conflict. Filter keys and
 * license conditions always combine by union.
 */
export function isQuickfilterCompatible(
  current: AttributionFilters,
  quickfilter: SavedQuickfilter,
): boolean {
  const currentValues = current.valueFilters;
  const incomingValues = quickfilter.filters.valueFilters;

  return (
    scalarValuesCompatible(
      current.search || undefined,
      quickfilter.filters.search || undefined,
    ) &&
    scalarValuesCompatible(
      currentValues.classification,
      incomingValues.classification,
    ) &&
    scalarValuesCompatible(
      currentValues.criticality,
      incomingValues.criticality,
    ) &&
    scalarValuesCompatible(
      currentValues.incompleteCoordinates,
      incomingValues.incompleteCoordinates,
    ) &&
    scalarValuesCompatible(
      currentValues.incompleteLegal,
      incomingValues.incompleteLegal,
    )
  );
}

function mergeUnique<T>(current: Array<T>, incoming: Array<T>): Array<T> {
  return [...new Set([...current, ...incoming])];
}

function mergeLicenseOptions(
  current: Array<LicenseOption> | undefined,
  incoming: Array<LicenseOption> | undefined,
): Array<LicenseOption> | undefined {
  const merged = [...(current ?? [])];
  for (const option of incoming ?? []) {
    if (!merged.some((existing) => existing.id === option.id)) {
      merged.push(option);
    }
  }
  return merged.length ? merged : undefined;
}

/**
 * Merges a quickfilter's contribution into the given filters: filter keys,
 * licenses, and license searches combine by union; scalar value filters and
 * the search text keep the current value unless it is unset. Compatibility
 * is assumed and must be checked with {@link isQuickfilterCompatible}.
 */
export function mergeQuickfilterIntoFilters(
  current: AttributionFilters,
  quickfilter: SavedQuickfilter,
): AttributionFilters {
  const incoming = quickfilter.filters.valueFilters;
  const currentValues = current.valueFilters;
  const mergedValueFilters: AttributionFilters['valueFilters'] = {
    classification: currentValues.classification ?? incoming.classification,
    criticality: currentValues.criticality ?? incoming.criticality,
    incompleteCoordinates:
      currentValues.incompleteCoordinates ?? incoming.incompleteCoordinates,
    incompleteLegal: currentValues.incompleteLegal ?? incoming.incompleteLegal,
    license: mergeLicenseOptions(currentValues.license, incoming.license),
  };
  const mergedLicenseSearches = mergeUnique(
    currentValues.licenseSearches ?? [],
    incoming.licenseSearches ?? [],
  );
  if (mergedLicenseSearches.length) {
    mergedValueFilters.licenseSearches = mergedLicenseSearches;
  }

  return {
    ...current,
    filters: mergeUnique(current.filters, quickfilter.filters.filters),
    search: current.search || quickfilter.filters.search,
    valueFilters: mergedValueFilters,
    activeQuickfilterIds: mergeUnique(current.activeQuickfilterIds ?? [], [
      quickfilter.id,
    ]),
  };
}

/**
 * Rebuilds the combined filters from the given quickfilter ids, keeping the
 * passed sorting. Used when a quickfilter is removed from the combination.
 */
export function combineQuickfilters({
  ids,
  quickfilters,
  sorting,
}: {
  ids: Array<string>;
  quickfilters: Array<SavedQuickfilter>;
  sorting: AttributionFilters['sorting'];
}): AttributionFilters {
  return quickfilters
    .filter((quickfilter) => ids.includes(quickfilter.id))
    .reduce(
      (combined, quickfilter) =>
        mergeQuickfilterIntoFilters(combined, quickfilter),
      { ...initialAttributionFilters, sorting },
    );
}

export function useQuickfilters(scope: QuickfilterScope): {
  quickfilters: Array<SavedQuickfilter>;
  saveQuickfilter: (name: string, filters: AttributionFilters) => void;
  deleteQuickfilter: (id: string) => void;
  markQuickfilterUsed: (id: string) => void;
} {
  const [userSettings, updateUserSettings] = useUserSettings();

  const quickfilters = useMemo(
    () =>
      userSettings.savedQuickfilters
        .filter((quickfilter) => quickfilter.scope === scope)
        .sort((first, second) => second.lastUsedAt - first.lastUsedAt),
    [userSettings.savedQuickfilters, scope],
  );

  const saveQuickfilter = (name: string, filters: AttributionFilters): void => {
    updateUserSettings((settings) => ({
      savedQuickfilters: [
        ...settings.savedQuickfilters,
        {
          id: uuid4(),
          name,
          lastUsedAt: Date.now(),
          scope,
          filters: toQuickfilterFilters(filters),
        },
      ],
    }));
  };

  const deleteQuickfilter = (id: string): void => {
    updateUserSettings((settings) => ({
      savedQuickfilters: settings.savedQuickfilters.filter(
        (quickfilter) => quickfilter.id !== id,
      ),
    }));
  };

  const markQuickfilterUsed = (id: string): void => {
    updateUserSettings((settings) => ({
      savedQuickfilters: settings.savedQuickfilters.map((quickfilter) =>
        quickfilter.id === id
          ? { ...quickfilter, lastUsedAt: Date.now() }
          : quickfilter,
      ),
    }));
  };

  return {
    quickfilters,
    saveQuickfilter,
    deleteQuickfilter,
    markQuickfilterUsed,
  };
}
