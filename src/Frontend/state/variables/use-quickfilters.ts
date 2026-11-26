// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { v4 as uuid4 } from 'uuid';

import type {
  ClassificationsConfig,
  LicenseOption,
  QuickfilterScope,
  RawClassificationsConfig,
  SavedAttributionQuickfilter,
  SavedQuickfilter,
} from '../../../shared/shared-types';
import { isVisibleForAttributionPanel } from './quickfilter-sharing';
import {
  deleteSavedQuickfilter,
  renameSavedQuickfilter,
  reorderSavedQuickfilter,
} from './saved-quickfilter-operations';
import {
  type AttributionFilters,
  initialAttributionFilters,
} from './use-filters';
import { useUserSettings } from './use-user-setting';

function toQuickfilterFilters({
  filters,
  search,
  valueFilters,
}: AttributionFilters): SavedAttributionQuickfilter['filters'] {
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

const SCALAR_VALUE_FILTER_KEYS = [
  'classification',
  'criticality',
  'incompleteCoordinates',
  'incompleteLegal',
] as const;

type ScalarFilterSources = Pick<AttributionFilters, 'search' | 'valueFilters'>;

/**
 * Single source of truth for {@link isQuickfilterCompatible} and
 * {@link quickfiltersConflict}: filter keys and license conditions combine by
 * union and never conflict; an empty search counts as unset.
 */
function scalarQuickfilterValuesConflict(
  first: ScalarFilterSources,
  second: ScalarFilterSources,
): boolean {
  return (
    !scalarValuesCompatible(
      first.search || undefined,
      second.search || undefined,
    ) ||
    SCALAR_VALUE_FILTER_KEYS.some(
      (key) =>
        !scalarValuesCompatible(
          first.valueFilters[key],
          second.valueFilters[key],
        ),
    )
  );
}

/** Whether a quickfilter can be merged into the given filters. */
export function isQuickfilterCompatible(
  current: AttributionFilters,
  quickfilter: SavedAttributionQuickfilter,
): boolean {
  return !scalarQuickfilterValuesConflict(current, quickfilter.filters);
}

/**
 * Whether every condition the quickfilter contributed is still present in the
 * given filters: adding filters on top keeps it selected, removing or
 * changing one of its conditions deselects it.
 */
export function areQuickfilterConditionsMet(
  current: AttributionFilters,
  quickfilter: SavedAttributionQuickfilter,
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

/** Whether the two quickfilters cannot be applied together. */
export function quickfiltersConflict(
  first: SavedQuickfilter,
  second: SavedQuickfilter,
): boolean {
  // Resource quickfilters only OR/union conditions and never conflict.
  if (first.scope === 'resource' || second.scope === 'resource') {
    return false;
  }
  return scalarQuickfilterValuesConflict(first.filters, second.filters);
}

/**
 * Whether a quickfilter fits the current project and settings. Classification
 * ids are project-local: an id the project does not define cannot be
 * expressed here, and one it does may refer to a different classification
 * than in the project the quickfilter was saved in (accepted).
 */
export function isQuickfilterUsableInProject(
  quickfilter: SavedAttributionQuickfilter,
  {
    classifications,
    showClassifications,
    showCriticality,
  }: {
    classifications: ClassificationsConfig | RawClassificationsConfig;
    showClassifications: boolean;
    showCriticality: boolean;
  },
): boolean {
  const { classification, criticality } = quickfilter.filters.valueFilters;

  if (
    classification !== undefined &&
    (!showClassifications ||
      !Object.keys(classifications).some((id) => Number(id) === classification))
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
 * Merges a quickfilter into the given filters: filter keys, licenses, and
 * license searches union; scalars keep the current value unless unset. With
 * `replaceConflictingScalars`, the quickfilter's scalars win instead.
 */
export function mergeQuickfilterIntoFilters(
  current: AttributionFilters,
  quickfilter: SavedAttributionQuickfilter,
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

export function combineQuickfilters({
  ids,
  quickfilters,
  sorting,
}: {
  ids: Array<string>;
  quickfilters: Array<SavedAttributionQuickfilter>;
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

/**
 * Removes a quickfilter's contribution from the given filters, merging the
 * remaining quickfilters back in so conditions they share with the removed
 * one survive. Conditions shared with a manually set filter cannot be
 * distinguished and are removed with it.
 */
export function removeQuickfilterConditions(
  current: AttributionFilters,
  removed: SavedAttributionQuickfilter,
  remaining: Array<SavedAttributionQuickfilter>,
): AttributionFilters {
  const removedValues = removed.filters.valueFilters;
  const currentValues = current.valueFilters;
  const keptLicenses = currentValues.license?.filter(
    (option) =>
      !removedValues.license?.some(
        (removedOption) => removedOption.id === option.id,
      ),
  );
  const keptLicenseSearches = currentValues.licenseSearches?.filter(
    (search) => !removedValues.licenseSearches?.includes(search),
  );
  const keptQuickfilterIds = (current.activeQuickfilterIds ?? []).filter(
    (activeId) => activeId !== removed.id,
  );
  const stripped: AttributionFilters = {
    ...current,
    filters: current.filters.filter(
      (filterKey) => !removed.filters.filters.includes(filterKey),
    ),
    search:
      removed.filters.search && current.search === removed.filters.search
        ? ''
        : current.search,
    valueFilters: {
      classification:
        removedValues.classification !== undefined &&
        currentValues.classification === removedValues.classification
          ? undefined
          : currentValues.classification,
      criticality:
        removedValues.criticality !== undefined &&
        currentValues.criticality === removedValues.criticality
          ? undefined
          : currentValues.criticality,
      incompleteCoordinates:
        removedValues.incompleteCoordinates !== undefined &&
        currentValues.incompleteCoordinates ===
          removedValues.incompleteCoordinates
          ? undefined
          : currentValues.incompleteCoordinates,
      incompleteLegal:
        removedValues.incompleteLegal !== undefined &&
        currentValues.incompleteLegal === removedValues.incompleteLegal
          ? undefined
          : currentValues.incompleteLegal,
      license: keptLicenses?.length ? keptLicenses : undefined,
      licenseSearches: keptLicenseSearches?.length
        ? keptLicenseSearches
        : undefined,
    },
    activeQuickfilterIds: keptQuickfilterIds.length
      ? keptQuickfilterIds
      : undefined,
  };
  return remaining.reduce(
    (combined, quickfilter) =>
      mergeQuickfilterIntoFilters(combined, quickfilter),
    stripped,
  );
}

export function useQuickfilters(scope: Exclude<QuickfilterScope, 'resource'>): {
  quickfilters: Array<SavedAttributionQuickfilter>;
  saveQuickfilter: (name: string, filters: AttributionFilters) => string;
  deleteQuickfilter: (id: string) => void;
  renameQuickfilter: (id: string, name: string) => void;
  reorderQuickfilter: (id: string, targetIndex: number) => void;
} {
  const [userSettings, updateUserSettings] = useUserSettings();

  // savedQuickfilters is the display order: the list shows the panel's
  // own-scope quickfilters plus the license-only ones shared with the other
  // panels.
  const quickfilters = useMemo(
    () =>
      userSettings.savedQuickfilters.filter(
        (quickfilter): quickfilter is SavedAttributionQuickfilter =>
          isVisibleForAttributionPanel(scope)(quickfilter),
      ),
    [userSettings.savedQuickfilters, scope],
  );

  const saveQuickfilter = (
    name: string,
    filters: AttributionFilters,
  ): string => {
    const id = uuid4();
    // Optimistic so the saved quickfilter shows up without the persistence
    // round-trip.
    updateUserSettings(
      (settings) => ({
        savedQuickfilters: [
          ...settings.savedQuickfilters,
          {
            id,
            name,
            scope,
            filters: toQuickfilterFilters(filters),
          },
        ],
      }),
      { optimistic: true },
    );
    return id;
  };

  const deleteQuickfilter = (id: string): void =>
    deleteSavedQuickfilter(updateUserSettings, id);

  const renameQuickfilter = (id: string, name: string): void =>
    renameSavedQuickfilter(updateUserSettings, id, name);

  const reorderQuickfilter = (id: string, targetIndex: number): void =>
    reorderSavedQuickfilter(
      updateUserSettings,
      id,
      targetIndex,
      isVisibleForAttributionPanel(scope),
    );

  return {
    quickfilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  };
}
