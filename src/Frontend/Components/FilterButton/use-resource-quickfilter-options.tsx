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
  removeResourceQuickfilterConditions,
  useResourceQuickfilters,
} from '../../state/variables/use-resource-quickfilters';
import type { FilterOption } from './FilterButton';
import { QuickfiltersPanel } from './quickfilter-panels';

type SetResourceTreeFilters = (
  update:
    ResourceTreeFilters | ((prev: ResourceTreeFilters) => ResourceTreeFilters),
) => void;

/**
 * The quickfilters menu entry for the resource tree. Resource quickfilters
 * only combine and never conflict, so there are no conflict or
 * incompatibility rows here.
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
      setFilters((prev) => {
        const activeIds = prev.activeQuickfilterIds ?? [];
        const removed = visibleQuickfilters.find(
          ({ id: quickfilterId }) => quickfilterId === id,
        );
        const remaining = visibleQuickfilters.filter(
          (quickfilter) =>
            quickfilter.id !== id && activeIds.includes(quickfilter.id),
        );
        return removed
          ? removeResourceQuickfilterConditions(prev, removed, remaining)
          : combineResourceQuickfilters({
              ids: activeIds.filter((activeId) => activeId !== id),
              quickfilters: visibleQuickfilters,
            });
      });
    };

    // Deleting a selected quickfilter also deselects it.
    const deleteSelectedResourceQuickfilter = (id: string): void => {
      if (activeIds.includes(id)) {
        removeResourceQuickfilter(id);
      }
      deleteQuickfilter(id);
    };

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

    // Manual filters may be added on top of an applied quickfilter, so
    // saving is always offered while filters are active.
    const showSaveHint = hasActiveFilters;

    return [
      {
        kind: 'panel' as const,
        id: 'quickfilters',
        selected: false,
        label: activeIds.length
          ? text.quickfilters.titleSelected
          : text.quickfilters.title,
        // The accessible name stays stable so tests can rely on it.
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
