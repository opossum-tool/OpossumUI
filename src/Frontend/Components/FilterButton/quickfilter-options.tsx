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
  MAX_RECENT_QUICKFILTERS,
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
    const applyQuickfilter = (quickfilter: SavedQuickfilter): void => {
      // The sorting is intentionally kept from the current filters.
      setFilters({
        ...filters,
        filters: [...quickfilter.filters.filters],
        search: quickfilter.filters.search,
        valueFilters: structuredClone(quickfilter.filters.valueFilters),
      });
      markQuickfilterUsed(quickfilter.id);
    };

    const recentQuickfilterOptions = quickfilters
      .slice(0, MAX_RECENT_QUICKFILTERS)
      .map((quickfilter) => ({
        kind: 'toggle' as const,
        id: `quickfilter-${quickfilter.id}`,
        selected: false,
        label: quickfilter.name,
        tinted: true,
        icon: <BookmarkIcon sx={baseIcon} />,
        onAdd: () => applyQuickfilter(quickfilter),
      }));

    const moreQuickfiltersOption: Array<FilterOption> =
      quickfilters.length > MAX_RECENT_QUICKFILTERS
        ? [
            {
              kind: 'panel' as const,
              id: 'quickfilters-more',
              selected: false,
              label: text.quickfilters.more,
              tinted: true,
              icon: <BookmarkIcon sx={baseIcon} />,
              endIcon: <ChevronRightIcon />,
              renderPanel: ({ id, onClose, initialFocusRef }) => (
                <QuickfilterListPanel
                  id={id}
                  quickfilters={quickfilters}
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
                onClose={onClose}
                initialFocusRef={initialFocusRef}
              />
            ),
          },
        ]
      : [];

    return [
      ...recentQuickfilterOptions,
      ...moreQuickfiltersOption,
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
