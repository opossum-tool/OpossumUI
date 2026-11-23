// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SavedQuickfilter } from '../../../shared/shared-types';
import type { UpdateUserSettings } from './use-user-setting';

/**
 * Removes a saved quickfilter from the persisted list. Shared by every
 * quickfilter panel: deletions always affect the actual entry, not a panel's
 * derived model of it.
 */
export function deleteSavedQuickfilter(
  updateUserSettings: UpdateUserSettings,
  id: string,
): void {
  updateUserSettings(
    (settings) => ({
      savedQuickfilters: settings.savedQuickfilters.filter(
        (quickfilter) => quickfilter.id !== id,
      ),
    }),
    { optimistic: true },
  );
}

/**
 * Renames a saved quickfilter in the persisted list. Shared by every
 * quickfilter panel: renames always affect the actual entry, not a panel's
 * derived model of it.
 */
export function renameSavedQuickfilter(
  updateUserSettings: UpdateUserSettings,
  id: string,
  name: string,
): void {
  updateUserSettings(
    (settings) => ({
      savedQuickfilters: settings.savedQuickfilters.map((quickfilter) =>
        quickfilter.id === id ? { ...quickfilter, name } : quickfilter,
      ),
    }),
    { optimistic: true },
  );
}

/**
 * Reorders within the given panel's visible subset while keeping the array
 * positions of everything else untouched: savedQuickfilters is the display
 * order. Optimistic so the reordered list renders immediately. Shared by
 * every quickfilter panel; only the visibility rule differs.
 */
export function reorderSavedQuickfilter(
  updateUserSettings: UpdateUserSettings,
  id: string,
  targetIndex: number,
  isVisible: (quickfilter: SavedQuickfilter) => boolean,
): void {
  updateUserSettings(
    (settings) => {
      const visible = settings.savedQuickfilters.filter(isVisible);
      const index = visible.findIndex((quickfilter) => quickfilter.id === id);
      if (
        index === -1 ||
        targetIndex < 0 ||
        targetIndex >= visible.length ||
        targetIndex === index
      ) {
        return {};
      }
      const reordered = [...visible];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      let cursor = 0;
      return {
        savedQuickfilters: settings.savedQuickfilters.map((quickfilter) =>
          isVisible(quickfilter) ? reordered[cursor++] : quickfilter,
        ),
      };
    },
    { optimistic: true },
  );
}
