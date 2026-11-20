// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useMemo } from 'react';

import type { SavedResourceQuickfilter } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon } from '../../shared-styles';
import { useVisibleQuickfiltersForResources } from '../../state/variables/quickfilter-sharing';
import {
  hasActiveResourceTreeFilters,
  type ResourceTreeFilters,
} from '../../state/variables/use-filters';
import {
  combineResourceQuickfilters,
  mergeResourceQuickfilterIntoFilters,
  useResourceQuickfilters,
} from '../../state/variables/use-resource-quickfilters';
import type { FilterOption } from './FilterButton';
import { QuickfiltersPanel } from './quickfilter-panels';

type SetResourceTreeFilters = (
  update:
    ResourceTreeFilters | ((prev: ResourceTreeFilters) => ResourceTreeFilters),
) => void;

/**
 * The quickfilters menu entry for the resource tree. Resource filters only
 * combine (booleans OR, licenses union) and never conflict, so the panel
 * handles everything without conflict or incompatibility rows.
 */
export function useResourceQuickfilterOption({
  filters,
  setFilters,
}: {
  filters: ResourceTreeFilters;
  setFilters: SetResourceTreeFilters;
}): Array<FilterOption> {
  const {
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  } = useResourceQuickfilters();
  const visibleQuickfilters = useVisibleQuickfiltersForResources();
  const hasActiveFilters = hasActiveResourceTreeFilters(filters);

  return useMemo(() => {
    const activeIds = filters.activeQuickfilterIds ?? [];

    const applyResourceQuickfilter = (
      quickfilter: SavedResourceQuickfilter,
    ): void => {
      if (activeIds.includes(quickfilter.id)) {
        removeResourceQuickfilter(quickfilter.id);
        return;
      }
      setFilters((prev) =>
        mergeResourceQuickfilterIntoFilters(prev, quickfilter),
      );
    };

    const removeResourceQuickfilter = (id: string): void => {
      setFilters((prev) =>
        combineResourceQuickfilters({
          ids: (prev.activeQuickfilterIds ?? []).filter(
            (activeId) => activeId !== id,
          ),
          quickfilters: visibleQuickfilters,
        }),
      );
    };

    // Deleting a selected quickfilter also deselects it: the filters are
    // rebuilt from the remaining quickfilters exactly like when unchecking,
    // so the menu label no longer counts the deleted quickfilter.
    const deleteSelectedResourceQuickfilter = (id: string): void => {
      if (activeIds.includes(id)) {
        removeResourceQuickfilter(id);
      }
      deleteQuickfilter(id);
    };

    // Same rebuild semantics as removing a single quickfilter.
    const clearAllResourceQuickfilters = (): void => {
      setFilters(
        combineResourceQuickfilters({
          ids: [],
          quickfilters: visibleQuickfilters,
        }),
      );
    };

    const activateSavedResourceQuickfilter = (id: string): void => {
      setFilters((prev) => ({
        ...prev,
        activeQuickfilterIds: [...activeIds, id],
      }));
    };

    // Unlike the attribution menus, the entry is always offered: with active
    // filters it nudges towards saving them, otherwise it lists the saved
    // quickfilters (possibly empty).
    // Nudge users to persist manual filter selections. A selection produced
    // by an applied quickfilter is already saved, so no hint is needed.
    const showSaveHint = hasActiveFilters && !activeIds.length;

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
            quickfilters={visibleQuickfilters}
            onApply={applyResourceQuickfilter}
            onDelete={deleteSelectedResourceQuickfilter}
            onRename={renameQuickfilter}
            onReorder={reorderQuickfilter}
            onSave={(name) => {
              const savedId = saveQuickfilter(name, filters);
              activateSavedResourceQuickfilter(savedId);
            }}
            onClearAll={clearAllResourceQuickfilters}
            onClose={onClose}
            initialFocusRef={initialFocusRef}
          />
        ),
      },
    ];
  }, [
    visibleQuickfilters,
    filters,
    setFilters,
    hasActiveFilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  ]);
}
