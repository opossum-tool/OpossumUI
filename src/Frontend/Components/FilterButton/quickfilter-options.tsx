// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MuiTooltip from '@mui/material/Tooltip';
import { useMemo } from 'react';

import type {
  QuickfilterScope,
  SavedQuickfilter,
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
  scope: QuickfilterScope;
}): Array<FilterOption> {
  const { quickfilters, deleteQuickfilter } = useQuickfilters(scope);
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

    const applyQuickfilter = (quickfilter: SavedQuickfilter): void => {
      if (activeIds.includes(quickfilter.id)) {
        removeQuickfilter(quickfilter);
        return;
      }
      if (!isQuickfilterCompatible(filters, quickfilter)) {
        return;
      }
      setFilters(mergeQuickfilterIntoFilters(filters, quickfilter));
    };

    const removeQuickfilter = (quickfilter: SavedQuickfilter): void => {
      // The sorting is intentionally kept from the current filters.
      setFilters(
        combineQuickfilters({
          ids: activeIds.filter((id) => id !== quickfilter.id),
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
        label: text.quickfilters.title,
        // The tooltip on the icon renders hidden text inside the menu item;
        // an explicit label keeps the accessible name stable.
        ariaLabel: text.quickfilters.title,
        tinted: true,
        icon: showSaveHint ? (
          <MuiTooltip
            title={text.quickfilters.saveHint}
            disableInteractive
            placement={'bottom'}
          >
            <span>
              <BookmarkAddIcon sx={baseIcon} color={'primary'} />
            </span>
          </MuiTooltip>
        ) : (
          <BookmarkIcon sx={baseIcon} />
        ),
        endIcon: <ChevronRightIcon />,
        renderPanel: ({ id, onClose, initialFocusRef }) => (
          <QuickfiltersPanel
            id={id}
            filters={filters}
            scope={scope}
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
            onSaved={activateSavedQuickfilter}
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
    scope,
    deleteQuickfilter,
  ]);
}
