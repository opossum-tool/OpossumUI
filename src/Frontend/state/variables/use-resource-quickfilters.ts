// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { v4 as uuid4 } from 'uuid';

import {
  isResourceQuickfilter,
  type SavedResourceQuickfilter,
} from '../../../shared/shared-types';
import { isVisibleForResourcePanel } from './quickfilter-sharing';
import {
  deleteSavedQuickfilter,
  renameSavedQuickfilter,
  reorderSavedQuickfilter,
} from './saved-quickfilter-operations';
import type { ResourceTreeFilters } from './use-filters';
import { useUserSettings } from './use-user-setting';

/**
 * Quickfilters for the resource tree, mirroring the attribution quickfilter
 * hook. The filter shape differs (booleans and license selections instead of
 * attribution filter keys), so applying combines by OR-ing the booleans and
 * unioning the license conditions.
 */
export function mergeResourceQuickfilterIntoFilters(
  current: ResourceTreeFilters,
  quickfilter: SavedResourceQuickfilter,
): ResourceTreeFilters {
  const incoming = quickfilter.filters;
  const mergedLicenses = [...current.selectedLicenses];
  for (const option of incoming.selectedLicenses) {
    if (!mergedLicenses.some((existing) => existing.id === option.id)) {
      mergedLicenses.push(option);
    }
  }
  const mergedLicenseSearches = [
    ...new Set([
      ...(current.licenseSearches ?? []),
      ...(incoming.licenseSearches ?? []),
    ]),
  ];
  return {
    ...current,
    onlyUnreviewedFiles:
      current.onlyUnreviewedFiles || incoming.onlyUnreviewedFiles,
    onlyWithAiDeferredAttributions:
      current.onlyWithAiDeferredAttributions ||
      incoming.onlyWithAiDeferredAttributions,
    selectedLicenses: mergedLicenses,
    licenseSearches: mergedLicenseSearches.length
      ? mergedLicenseSearches
      : undefined,
    activeQuickfilterIds: [
      ...new Set([...(current.activeQuickfilterIds ?? []), quickfilter.id]),
    ],
  };
}

/**
 * Whether every condition the resource quickfilter contributes is still
 * present in the given filters. Mirrors the attribution quickfilter rule:
 * adding further filters on top keeps the quickfilter selected, removing or
 * turning off one of its conditions deselects it.
 */
export function areResourceQuickfilterConditionsMet(
  current: ResourceTreeFilters,
  quickfilter: SavedResourceQuickfilter,
): boolean {
  const incoming = quickfilter.filters;
  if (incoming.onlyUnreviewedFiles && !current.onlyUnreviewedFiles) {
    return false;
  }
  if (
    incoming.onlyWithAiDeferredAttributions &&
    !current.onlyWithAiDeferredAttributions
  ) {
    return false;
  }
  if (
    incoming.selectedLicenses.some(
      (option) => !current.selectedLicenses.some(({ id }) => id === option.id),
    )
  ) {
    return false;
  }
  if (
    incoming.licenseSearches?.some(
      (search) => !(current.licenseSearches ?? []).includes(search),
    )
  ) {
    return false;
  }
  return true;
}

/**
 * Rebuilds the combined resource filters from the given quickfilter ids.
 * Used when a quickfilter is removed from the combination or all are cleared.
 */
export function combineResourceQuickfilters({
  ids,
  quickfilters,
}: {
  ids: Array<string>;
  quickfilters: Array<SavedResourceQuickfilter>;
}): ResourceTreeFilters {
  return quickfilters
    .filter((quickfilter) => ids.includes(quickfilter.id))
    .reduce(mergeResourceQuickfilterIntoFilters, {
      onlyUnreviewedFiles: false,
      onlyWithAiDeferredAttributions: false,
      selectedLicenses: [],
    });
}

/**
 * Removes a quickfilter's contribution from the given resource filters while
 * keeping everything else: filters set separately and the conditions the
 * remaining quickfilters contribute (they are merged back in case they share
 * a condition with the removed quickfilter). Conditions the quickfilter
 * shares with a manually set filter cannot be distinguished and are removed
 * with it.
 */
export function removeResourceQuickfilterConditions(
  current: ResourceTreeFilters,
  removed: SavedResourceQuickfilter,
  remaining: Array<SavedResourceQuickfilter>,
): ResourceTreeFilters {
  const removedFilters = removed.filters;
  const keptLicenses = current.selectedLicenses.filter(
    (option) =>
      !removedFilters.selectedLicenses.some(
        (removedOption) => removedOption.id === option.id,
      ),
  );
  const keptLicenseSearches = (current.licenseSearches ?? []).filter(
    (search) => !removedFilters.licenseSearches?.includes(search),
  );
  const keptQuickfilterIds = (current.activeQuickfilterIds ?? []).filter(
    (activeId) => activeId !== removed.id,
  );
  const stripped: ResourceTreeFilters = {
    ...current,
    onlyUnreviewedFiles:
      current.onlyUnreviewedFiles && removedFilters.onlyUnreviewedFiles
        ? false
        : current.onlyUnreviewedFiles,
    onlyWithAiDeferredAttributions:
      current.onlyWithAiDeferredAttributions &&
      removedFilters.onlyWithAiDeferredAttributions
        ? false
        : current.onlyWithAiDeferredAttributions,
    selectedLicenses: keptLicenses,
    licenseSearches: keptLicenseSearches.length
      ? keptLicenseSearches
      : undefined,
    activeQuickfilterIds: keptQuickfilterIds.length
      ? keptQuickfilterIds
      : undefined,
  };
  return remaining.reduce(mergeResourceQuickfilterIntoFilters, stripped);
}

export function useResourceQuickfilters(): {
  quickfilters: Array<SavedResourceQuickfilter>;
  saveQuickfilter: (name: string, filters: ResourceTreeFilters) => string;
  deleteQuickfilter: (id: string) => void;
  renameQuickfilter: (id: string, name: string) => void;
  reorderQuickfilter: (id: string, targetIndex: number) => void;
} {
  const [userSettings, updateUserSettings] = useUserSettings();

  // savedQuickfilters is the display order, which the user can change by
  // reordering.
  const quickfilters = useMemo(
    () => userSettings.savedQuickfilters.filter(isResourceQuickfilter),
    [userSettings.savedQuickfilters],
  );

  const saveQuickfilter = (
    name: string,
    filters: ResourceTreeFilters,
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
            scope: 'resource',
            filters: {
              onlyUnreviewedFiles: filters.onlyUnreviewedFiles,
              onlyWithAiDeferredAttributions:
                filters.onlyWithAiDeferredAttributions,
              selectedLicenses: [...filters.selectedLicenses],
              licenseSearches: filters.licenseSearches
                ? [...filters.licenseSearches]
                : undefined,
            },
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

  // Reorders within the panel's visible subset (resource quickfilters plus
  // shared license-only attribution/signal quickfilters).
  const reorderQuickfilter = (id: string, targetIndex: number): void =>
    reorderSavedQuickfilter(
      updateUserSettings,
      id,
      targetIndex,
      isVisibleForResourcePanel,
    );

  return {
    quickfilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  };
}
