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
  toResourceQuickfilterModel,
  useVisibleQuickfilters,
  useVisibleQuickfiltersForResources,
} from '../../state/variables/quickfilter-sharing';
import {
  type AttributionFilters,
  hasActiveAttributionFilters,
  useResourceTreeFilters,
} from '../../state/variables/use-filters';
import {
  combineQuickfilters,
  isQuickfilterCompatible,
  isQuickfilterUsableInProject,
  mergeQuickfilterIntoFilters,
  useQuickfilters,
} from '../../state/variables/use-quickfilters';
import {
  combineResourceQuickfilters,
  mergeResourceQuickfilterIntoFilters,
} from '../../state/variables/use-resource-quickfilters';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { useClassifications } from '../../util/use-classifications';
import type { FilterOption } from './FilterButton';
import { QuickfiltersPanel } from './quickfilter-panels';

type SetFilters = (filters: AttributionFilters) => void;

export function useQuickfilterOptions({
  filters,
  setFilters,
  scope,
  crossActivateResource = false,
}: {
  filters: AttributionFilters;
  setFilters: SetFilters;
  scope: Exclude<QuickfilterScope, 'resource'>;
  /**
   * Whether applying quickfilters should press license-only quickfilters on
   * the paired resources panel as well. Only the audit attributions panel
   * opts in; the report view and the signals panel keep their membership
   * local.
   */
  crossActivateResource?: boolean;
}): Array<FilterOption> {
  const {
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  } = useQuickfilters(scope);
  const visibleQuickfilters = useVisibleQuickfilters(scope);
  const visibleResourceQuickfilters = useVisibleQuickfiltersForResources();
  // Cross-panel membership: shared license-only quickfilters show as pressed
  // on the paired panels too, and their ids live in both filter variables.
  const [, setResourceTreeFilters] = useResourceTreeFilters();
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
      visibleQuickfilters
        .filter(
          (quickfilter) =>
            !isQuickfilterUsableInProject(quickfilter, usabilityContext),
        )
        .map(({ id }) => id),
    [visibleQuickfilters, usabilityContext],
  );

  return useMemo(() => {
    const activeIds = filters.activeQuickfilterIds ?? [];

    const sharedResourceModel = (quickfilter: SavedAttributionQuickfilter) =>
      crossActivateResource ? toResourceQuickfilterModel(quickfilter) : null;

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
      const sharedResource = sharedResourceModel(quickfilter);
      if (sharedResource) {
        // License-only quickfilters are shared with the resource tree;
        // apply the converted model there as well so its row is pressed on
        // both panels.
        setResourceTreeFilters((prev) =>
          mergeResourceQuickfilterIntoFilters(prev, sharedResource),
        );
      }
    };

    const removeQuickfilter = (
      quickfilter: SavedAttributionQuickfilter,
    ): void => {
      // The sorting is intentionally kept from the current filters.
      setFilters(
        combineQuickfilters({
          ids: activeIds.filter((id) => id !== quickfilter.id),
          quickfilters: visibleQuickfilters,
          sorting: filters.sorting,
        }),
      );
      if (sharedResourceModel(quickfilter)) {
        setResourceTreeFilters((prev) =>
          combineResourceQuickfilters({
            ids: (prev.activeQuickfilterIds ?? []).filter(
              (id) => id !== quickfilter.id,
            ),
            quickfilters: visibleResourceQuickfilters,
          }),
        );
      }
    };

    // Same rebuild semantics as removing a single quickfilter: everything
    // the quickfilters contributed is dropped, manual filters on top go with
    // it, and the sorting is kept. Shared quickfilters are also removed from
    // the paired resources panel.
    const clearAllQuickfilters = (): void => {
      setFilters(
        combineQuickfilters({
          ids: [],
          quickfilters: visibleQuickfilters,
          sorting: filters.sorting,
        }),
      );
      const sharedIds = new Set(
        activeIds
          .map((id) =>
            visibleQuickfilters.find((quickfilter) => quickfilter.id === id),
          )
          .filter(
            (quickfilter): quickfilter is SavedAttributionQuickfilter =>
              quickfilter !== undefined && !!sharedResourceModel(quickfilter),
          )
          .map(({ id }) => id),
      );
      if (sharedIds.size) {
        setResourceTreeFilters((prev) =>
          combineResourceQuickfilters({
            ids: (prev.activeQuickfilterIds ?? []).filter(
              (id) => !sharedIds.has(id),
            ),
            quickfilters: visibleResourceQuickfilters,
          }),
        );
      }
    };

    const activateSavedQuickfilter = (id: string): void => {
      setFilters({
        ...filters,
        activeQuickfilterIds: [...activeIds, id],
      });
    };

    if (!visibleQuickfilters.length && !hasActiveFilters) {
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
            quickfilters={visibleQuickfilters}
            incompatibleProjectIds={incompatibleProjectIds}
            conflictingIds={visibleQuickfilters
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
    visibleQuickfilters,
    visibleResourceQuickfilters,
    incompatibleProjectIds,
    filters,
    setFilters,
    setResourceTreeFilters,
    crossActivateResource,
    hasActiveFilters,
    saveQuickfilter,
    deleteQuickfilter,
    renameQuickfilter,
    reorderQuickfilter,
  ]);
}
