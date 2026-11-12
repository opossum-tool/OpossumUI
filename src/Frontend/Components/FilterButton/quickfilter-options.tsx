// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useMemo } from 'react';

import type {
  QuickfilterScope,
  SavedAttributionQuickfilter,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon } from '../../shared-styles';
import {
  type AttributionFilters,
  hasActiveAttributionFilters,
} from '../../state/variables/use-filters';
import {
  combineQuickfilters,
  isQuickfilterCompatible,
  isQuickfilterUsableInProject,
  mergeQuickfilterIntoFilters,
  useQuickfilters,
} from '../../state/variables/use-quickfilters';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { useClassifications } from '../../util/use-classifications';
import type { FilterOption } from './FilterButton';
import { QuickfiltersPanel } from './quickfilter-panels';

type SetFilters = (filters: AttributionFilters) => void;

export function useQuickfilterOptions({
  filters,
  setFilters,
  scope,
}: {
  filters: AttributionFilters;
  setFilters: SetFilters;
  scope: Exclude<QuickfilterScope, 'resource'>;
}): Array<FilterOption> {
  const {
    quickfilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  } = useQuickfilters(scope);
  const classifications = useClassifications();
  const [userSettings] = useUserSettings();
  const hasActiveFilters = hasActiveAttributionFilters(filters);

  const usabilityContext = useMemo(
    () => ({
      classificationIds: new Set(
        Object.keys(classifications).map((id) => Number(id)),
      ),
      showClassifications: userSettings.showClassifications,
      showCriticality: userSettings.showCriticality,
    }),
    [
      classifications,
      userSettings.showClassifications,
      userSettings.showCriticality,
    ],
  );
  const incompatibleProjectIds = useMemo(
    () =>
      quickfilters
        .filter(
          (quickfilter) =>
            !isQuickfilterUsableInProject(quickfilter, usabilityContext),
        )
        .map(({ id }) => id),
    [quickfilters, usabilityContext],
  );

  return useMemo(() => {
    const activeIds = filters.activeQuickfilterIds ?? [];

    const applyQuickfilter = (
      quickfilter: SavedAttributionQuickfilter,
    ): void => {
      if (activeIds.includes(quickfilter.id)) {
        removeQuickfilter(quickfilter);
        return;
      }
      // Conflicting quickfilters apply as well: the clashing scalar filters
      // (search text, classification, …) are overwritten with the
      // quickfilter's values and everything else is kept. Quickfilters whose
      // conditions are no longer met are deselected automatically (see the
      // pruning of active quickfilter ids when filters change).
      setFilters(
        mergeQuickfilterIntoFilters(filters, quickfilter, {
          replaceConflictingScalars: !isQuickfilterCompatible(
            filters,
            quickfilter,
          ),
        }),
      );
    };

    const removeQuickfilter = (
      quickfilter: SavedAttributionQuickfilter,
    ): void => {
      // The sorting is intentionally kept from the current filters.
      setFilters(
        combineQuickfilters({
          ids: activeIds.filter((id) => id !== quickfilter.id),
          quickfilters,
          sorting: filters.sorting,
        }),
      );
    };

    // Same rebuild semantics as removing a single quickfilter: everything
    // the quickfilters contributed is dropped, manual filters on top go with
    // it, and the sorting is kept.
    const clearAllQuickfilters = (): void => {
      setFilters(
        combineQuickfilters({
          ids: [],
          quickfilters,
          sorting: filters.sorting,
        }),
      );
    };

    const activateSavedQuickfilter = (id: string): void => {
      setFilters({
        ...filters,
        activeQuickfilterIds: [...activeIds, id],
      });
    };

    if (!quickfilters.length && !hasActiveFilters) {
      return [];
    }

    // Nudge users to persist manual filter selections. A selection produced
    // by an applied quickfilter is already saved, so no hint is needed.
    const showSaveHint =
      hasActiveFilters && !(filters.activeQuickfilterIds ?? []).length;

    // A single menu entry keeps the filter menu clean; everything happens
    // inside the side panel (recently used list, save, manage).
    return [
      {
        kind: 'panel' as const,
        id: 'quickfilters',
        selected: false,
        label: activeIds.length
          ? text.quickfilters.titleSelected
          : text.quickfilters.title,
        // The visible label reflects the selection; the accessible name
        // stays stable so tests and assistive tech can rely on it.
        ariaLabel: text.quickfilters.title,
        tinted: true,
        tooltip: showSaveHint ? text.quickfilters.saveHint : undefined,
        icon: showSaveHint ? (
          <BookmarkAddIcon sx={baseIcon} color={'primary'} />
        ) : (
          <BookmarkIcon sx={baseIcon} />
        ),
        endIcon: <ChevronRightIcon />,
        renderPanel: ({ id, onClose, initialFocusRef }) => (
          <QuickfiltersPanel
            id={id}
            activeQuickfilterIds={activeIds}
            hasActiveFilters={hasActiveFilters}
            quickfilters={quickfilters}
            incompatibleProjectIds={incompatibleProjectIds}
            conflictingIds={quickfilters
              .filter(
                (quickfilter) => !isQuickfilterCompatible(filters, quickfilter),
              )
              .map(({ id }) => id)}
            onApply={applyQuickfilter}
            onDelete={deleteQuickfilter}
            onRename={renameQuickfilter}
            onReorder={reorderQuickfilter}
            onSave={(name) => {
              const savedId = saveQuickfilter(name, filters);
              activateSavedQuickfilter(savedId);
            }}
            onClearAll={clearAllQuickfilters}
            onClose={onClose}
            initialFocusRef={initialFocusRef}
          />
        ),
      },
    ];
  }, [
    quickfilters,
    incompatibleProjectIds,
    filters,
    setFilters,
    hasActiveFilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  ]);
}
