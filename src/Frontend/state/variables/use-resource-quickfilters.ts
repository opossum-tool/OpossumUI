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

/** Merges a resource quickfilter into the given filters. */
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
 * Whether every condition the resource quickfilter contributed is still
 * present in the given filters (mirrors {@link areQuickfilterConditionsMet}).
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
 * Removes a quickfilter's contribution from the given resource filters,
 * merging the remaining quickfilters back in so conditions they share with
 * the removed one survive.
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

  const quickfilters = useMemo(
    () => userSettings.savedQuickfilters.filter(isResourceQuickfilter),
    [userSettings.savedQuickfilters],
  );

  const saveQuickfilter = (
    name: string,
    filters: ResourceTreeFilters,
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
