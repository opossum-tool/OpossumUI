// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual } from 'lodash-es';
import { useMemo } from 'react';
import { v4 as uuid4 } from 'uuid';

import type {
  QuickfilterScope,
  SavedQuickfilter,
} from '../../../shared/shared-types';
import type { AttributionFilters } from './use-filters';
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

export function matchesQuickfilter(
  { filters, search, valueFilters }: AttributionFilters,
  quickfilter: SavedQuickfilter,
): boolean {
  return (
    isEqual(new Set(quickfilter.filters.filters), new Set(filters)) &&
    quickfilter.filters.search === search &&
    isEqual(quickfilter.filters.valueFilters, valueFilters)
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
