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

const SCALAR_VALUE_FILTER_KEYS = [
  'classification',
  'criticality',
  'incompleteCoordinates',
  'incompleteLegal',
] as const;

/**
 * Whether every condition the quickfilter contributes is still present in the
 * given filters. Quickfilters stay selected while this holds: adding further
 * filters on top keeps them selected, but removing or changing one of their
 * conditions deselects them.
 */
export function areQuickfilterConditionsMet(
  current: AttributionFilters,
  quickfilter: SavedQuickfilter,
): boolean {
  const incoming = quickfilter.filters;
  const incomingValues = incoming.valueFilters;
  const currentValues = current.valueFilters;

  if (
    incoming.filters.some((filterKey) => !current.filters.includes(filterKey))
  ) {
    return false;
  }
  if (incoming.search && current.search !== incoming.search) {
    return false;
  }
  for (const key of SCALAR_VALUE_FILTER_KEYS) {
    if (
      incomingValues[key] !== undefined &&
      currentValues[key] !== incomingValues[key]
    ) {
      return false;
    }
  }
  if (
    incomingValues.license?.some(
      (option) => !currentValues.license?.some(({ id }) => id === option.id),
    )
  ) {
    return false;
  }
  if (
    incomingValues.licenseSearches?.some(
      (search) => !(currentValues.licenseSearches ?? []).includes(search),
    )
  ) {
    return false;
  }
  return true;
}

function mergeUnique<T>(current: Array<T>, incoming: Array<T>): Array<T> {
  return [...new Set([...current, ...incoming])];
}

/**
 * Whether the two quickfilters cannot be applied together because both
 * define a scalar filter (search text, classification, criticality,
 * incomplete coordinates/legal) with different values. Filter keys and
 * license conditions always combine by union and never conflict.
 */
export function quickfiltersConflict(
  first: SavedQuickfilter,
  second: SavedQuickfilter,
): boolean {
  if (
    first.filters.search &&
    second.filters.search &&
    first.filters.search !== second.filters.search
  ) {
    return true;
  }
  return SCALAR_VALUE_FILTER_KEYS.some((key) => {
    const firstScalar = first.filters.valueFilters[key];
    const secondScalar = second.filters.valueFilters[key];
    return (
      firstScalar !== undefined &&
      secondScalar !== undefined &&
      firstScalar !== secondScalar
    );
  });
}

/**
 * Whether a quickfilter fits the current project and settings. Classification
 * ids are project-local, so a saved classification that the current project
 * does not define cannot be expressed here; classification and criticality
 * filters additionally depend on their visibility settings. Such quickfilters
 * are hidden from the menus.
 */
export function isQuickfilterUsableInProject(
  quickfilter: SavedQuickfilter,
  {
    classificationIds,
    showClassifications,
    showCriticality,
  }: {
    classificationIds: ReadonlySet<number>;
    showClassifications: boolean;
    showCriticality: boolean;
  },
): boolean {
  const { classification, criticality } = quickfilter.filters.valueFilters;

  if (
    classification !== undefined &&
    (!showClassifications || !classificationIds.has(classification))
  ) {
    return false;
  }

  return criticality === undefined || showCriticality;
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
 *
 * With `replaceConflictingScalars`, scalar fields defined by the quickfilter
 * win over the current values instead. This resolves conflicts detected by
 * {@link isQuickfilterCompatible}: applying a quickfilter that clashes with
 * the current search text or scalar value filter overwrites exactly those
 * values and keeps everything else.
 */
export function mergeQuickfilterIntoFilters(
  current: AttributionFilters,
  quickfilter: SavedQuickfilter,
  { replaceConflictingScalars = false } = {},
): AttributionFilters {
  const incoming = quickfilter.filters.valueFilters;
  const currentValues = current.valueFilters;
  const pickScalar = <T>(
    incomingScalar: T | undefined,
    currentScalar: T | undefined,
  ): T | undefined =>
    replaceConflictingScalars
      ? (incomingScalar ?? currentScalar)
      : (currentScalar ?? incomingScalar);
  const mergedValueFilters: AttributionFilters['valueFilters'] = {
    classification: pickScalar(
      incoming.classification,
      currentValues.classification,
    ),
    criticality: pickScalar(incoming.criticality, currentValues.criticality),
    incompleteCoordinates: pickScalar(
      incoming.incompleteCoordinates,
      currentValues.incompleteCoordinates,
    ),
    incompleteLegal: pickScalar(
      incoming.incompleteLegal,
      currentValues.incompleteLegal,
    ),
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
    search: replaceConflictingScalars
      ? quickfilter.filters.search || current.search
      : current.search || quickfilter.filters.search,
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
  saveQuickfilter: (name: string, filters: AttributionFilters) => string;
  deleteQuickfilter: (id: string) => void;
  renameQuickfilter: (id: string, name: string) => void;
  reorderQuickfilter: (id: string, targetIndex: number) => void;
} {
  const [userSettings, updateUserSettings] = useUserSettings();

  // In creation order: savedQuickfilters are appended on save.
  const quickfilters = useMemo(
    () =>
      userSettings.savedQuickfilters.filter(
        (quickfilter) => quickfilter.scope === scope,
      ),
    [userSettings.savedQuickfilters, scope],
  );

  const saveQuickfilter = (
    name: string,
    filters: AttributionFilters,
  ): string => {
    const id = uuid4();
    // Optimistic: the saved quickfilter must show up in the lists right away
    // (e.g. when the user opens the edit view immediately), without waiting
    // for the persistence round-trip.
    updateUserSettings(
      (settings) => ({
        savedQuickfilters: [
          ...settings.savedQuickfilters,
          {
            id,
            name,
            lastUsedAt: Date.now(),
            scope,
            filters: toQuickfilterFilters(filters),
          },
        ],
      }),
      { optimistic: true },
    );
    return id;
  };

  const deleteQuickfilter = (id: string): void => {
    updateUserSettings(
      (settings) => ({
        savedQuickfilters: settings.savedQuickfilters.filter(
          (quickfilter) => quickfilter.id !== id,
        ),
      }),
      { optimistic: true },
    );
  };

  const renameQuickfilter = (id: string, name: string): void => {
    updateUserSettings(
      (settings) => ({
        savedQuickfilters: settings.savedQuickfilters.map((quickfilter) =>
          quickfilter.id === id ? { ...quickfilter, name } : quickfilter,
        ),
      }),
      { optimistic: true },
    );
  };

  // Reorders within the scope by absolute index while keeping the array
  // positions of all other scopes untouched: savedQuickfilters is the
  // display order. Optimistic so the reordered list renders immediately
  // (the drop freeze clears as soon as it has rendered).
  const reorderQuickfilter = (id: string, targetIndex: number): void => {
    updateUserSettings(
      (settings) => {
        const scoped = settings.savedQuickfilters.filter(
          (quickfilter) => quickfilter.scope === scope,
        );
        const index = scoped.findIndex((quickfilter) => quickfilter.id === id);
        if (
          index === -1 ||
          targetIndex < 0 ||
          targetIndex >= scoped.length ||
          targetIndex === index
        ) {
          return {};
        }
        const reordered = [...scoped];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);
        let cursor = 0;
        return {
          savedQuickfilters: settings.savedQuickfilters.map((quickfilter) =>
            quickfilter.scope === scope ? reordered[cursor++] : quickfilter,
          ),
        };
      },
      { optimistic: true },
    );
  };

  return {
    quickfilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  };
}
