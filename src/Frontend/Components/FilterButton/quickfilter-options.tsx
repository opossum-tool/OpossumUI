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
  MAX_RECENT_QUICKFILTERS,
  mergeQuickfilterIntoFilters,
  useQuickfilters,
} from '../../state/variables/use-quickfilters';
import type { FilterOption } from './FilterButton';
import {
  QuickfilterListPanel,
  SaveQuickfilterPanel,
} from './quickfilter-panels';

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
  const { quickfilters, deleteQuickfilter, markQuickfilterUsed } =
    useQuickfilters(scope);
  const hasActiveFilters = hasActiveAttributionFilters(filters);

  return useMemo(() => {
    const activeIds = filters.activeQuickfilterIds ?? [];

    const applyQuickfilter = (quickfilter: SavedQuickfilter): void => {
      if (
        activeIds.includes(quickfilter.id) ||
        !isQuickfilterCompatible(filters, quickfilter)
      ) {
        return;
      }
      setFilters(mergeQuickfilterIntoFilters(filters, quickfilter));
      markQuickfilterUsed(quickfilter.id);
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

    const recentQuickfilterOptions = quickfilters
      .slice(0, MAX_RECENT_QUICKFILTERS)
      .map((quickfilter) => {
        const selected = activeIds.includes(quickfilter.id);
        return {
          kind: 'toggle' as const,
          id: `quickfilter-${quickfilter.id}`,
          selected,
          faded: !selected && !isQuickfilterCompatible(filters, quickfilter),
          label: quickfilter.name,
          tinted: true,
          icon: <BookmarkIcon sx={baseIcon} />,
          onAdd: () => applyQuickfilter(quickfilter),
          onDelete: () => removeQuickfilter(quickfilter),
        };
      });

    const manageQuickfiltersOption: Array<FilterOption> = quickfilters.length
      ? [
          {
            kind: 'panel' as const,
            id: 'quickfilters-more',
            selected: false,
            label:
              quickfilters.length > MAX_RECENT_QUICKFILTERS
                ? text.quickfilters.more
                : text.quickfilters.manage,
            tinted: true,
            icon: <BookmarkIcon sx={baseIcon} />,
            endIcon: <ChevronRightIcon />,
            renderPanel: ({ id, onClose, initialFocusRef }) => (
              <QuickfilterListPanel
                id={id}
                quickfilters={quickfilters}
                incompatibleIds={quickfilters
                  .filter(
                    (quickfilter) =>
                      !isQuickfilterCompatible(filters, quickfilter),
                  )
                  .map(({ id }) => id)}
                onApply={applyQuickfilter}
                onDelete={deleteQuickfilter}
                onClose={onClose}
                initialFocusRef={initialFocusRef}
              />
            ),
          },
        ]
      : [];

    const saveQuickfilterOption: Array<FilterOption> = hasActiveFilters
      ? [
          {
            kind: 'panel' as const,
            id: 'save-quickfilter',
            selected: false,
            label: text.quickfilters.save,
            icon: <BookmarkAddIcon sx={baseIcon} />,
            endIcon: <ChevronRightIcon />,
            renderPanel: ({ id, onClose, initialFocusRef }) => (
              <SaveQuickfilterPanel
                id={id}
                filters={filters}
                scope={scope}
                onSaved={activateSavedQuickfilter}
                onClose={onClose}
                initialFocusRef={initialFocusRef}
              />
            ),
          },
        ]
      : [];

    return [
      ...recentQuickfilterOptions,
      ...manageQuickfiltersOption,
      ...saveQuickfilterOption,
    ];
  }, [
    quickfilters,
    filters,
    setFilters,
    hasActiveFilters,
    scope,
    deleteQuickfilter,
    markQuickfilterUsed,
  ]);
}
