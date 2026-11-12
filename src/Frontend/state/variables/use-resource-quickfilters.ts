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

export function useResourceQuickfilters(): {
  quickfilters: Array<SavedResourceQuickfilter>;
  saveQuickfilter: (name: string, filters: ResourceTreeFilters) => string;
  deleteQuickfilter: (id: string) => void;
  renameQuickfilter: (id: string, name: string) => void;
  reorderQuickfilter: (id: string, targetIndex: number) => void;
} {
  const [userSettings, updateUserSettings] = useUserSettings();

  // In creation order: savedQuickfilters are appended on save.
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
            lastUsedAt: Date.now(),
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
  // display order. Optimistic so the reordered list renders immediately.
  const reorderQuickfilter = (id: string, targetIndex: number): void => {
    updateUserSettings(
      (settings) => {
        const scoped = settings.savedQuickfilters.filter(isResourceQuickfilter);
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
            isResourceQuickfilter(quickfilter)
              ? reordered[cursor++]
              : quickfilter,
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
