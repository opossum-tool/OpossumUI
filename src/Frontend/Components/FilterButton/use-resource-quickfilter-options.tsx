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
import {
  isShareableWithAttributionPanel,
  toAttributionQuickfilterModel,
  useVisibleQuickfilters,
  useVisibleQuickfiltersForResources,
} from '../../state/variables/quickfilter-sharing';
import {
  hasActiveResourceTreeFilters,
  type ResourceTreeFilters,
  useManualAttributionFilters,
} from '../../state/variables/use-filters';
import {
  combineQuickfilters,
  mergeQuickfilterIntoFilters,
} from '../../state/variables/use-quickfilters';
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
  const visibleAttributionQuickfilters = useVisibleQuickfilters('attribution');
  // Cross-panel membership: shared license-only quickfilters show as pressed
  // on the attributions panel too, applying the converted model there (the
  // live license sync keeps the license selections identical anyway).
  const [, setManualAttributionFilters] = useManualAttributionFilters();
  const hasActiveFilters = hasActiveResourceTreeFilters(filters);

  return useMemo(() => {
    const activeIds = filters.activeQuickfilterIds ?? [];

    const sharedAttributionModel = (quickfilter: SavedResourceQuickfilter) =>
      isShareableWithAttributionPanel(quickfilter, 'attribution')
        ? toAttributionQuickfilterModel(quickfilter, 'attribution')
        : null;

    const applyResourceQuickfilter = (
      quickfilter: SavedResourceQuickfilter,
    ): void => {
      if (activeIds.includes(quickfilter.id)) {
        setFilters((prev) =>
          combineResourceQuickfilters({
            ids: (prev.activeQuickfilterIds ?? []).filter(
              (id) => id !== quickfilter.id,
            ),
            quickfilters: visibleQuickfilters,
          }),
        );
        const model = sharedAttributionModel(quickfilter);
        if (model) {
          setManualAttributionFilters((prev) =>
            combineQuickfilters({
              ids: (prev.activeQuickfilterIds ?? []).filter(
                (id) => id !== quickfilter.id,
              ),
              quickfilters: visibleAttributionQuickfilters,
              sorting: prev.sorting,
            }),
          );
        }
        return;
      }
      setFilters((prev) =>
        mergeResourceQuickfilterIntoFilters(prev, quickfilter),
      );
      const model = sharedAttributionModel(quickfilter);
      if (model) {
        setManualAttributionFilters((prev) =>
          mergeQuickfilterIntoFilters(prev, model),
        );
      }
    };

    // Same rebuild semantics as removing a single quickfilter. Shared
    // quickfilters are also removed from the paired attributions panel.
    const clearAllResourceQuickfilters = (): void => {
      setFilters(
        combineResourceQuickfilters({
          ids: [],
          quickfilters: visibleQuickfilters,
        }),
      );
      const sharedIds = new Set(
        activeIds
          .map((id) =>
            visibleQuickfilters.find((quickfilter) => quickfilter.id === id),
          )
          .filter(
            (quickfilter): quickfilter is SavedResourceQuickfilter =>
              quickfilter !== undefined &&
              !!sharedAttributionModel(quickfilter),
          )
          .map(({ id }) => id),
      );
      if (sharedIds.size) {
        setManualAttributionFilters((prev) =>
          combineQuickfilters({
            ids: (prev.activeQuickfilterIds ?? []).filter(
              (id) => !sharedIds.has(id),
            ),
            quickfilters: visibleAttributionQuickfilters,
            sorting: prev.sorting,
          }),
        );
      }
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
            onDelete={deleteQuickfilter}
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
    visibleAttributionQuickfilters,
    filters,
    setFilters,
    setManualAttributionFilters,
    hasActiveFilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  ]);
}
