// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CopyrightIcon from '@mui/icons-material/Copyright';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import { useMemo } from 'react';

import { text } from '../../../shared/text';
import { MenuItem } from '../../Components/InputElements/Dropdown';
import { SelectMenuOption } from '../../Components/SelectMenu/SelectMenu';
import { baseIcon } from '../../shared-styles';
import { useVariable } from './use-variable';

export const auditViewSorting = Object.values(text.auditViewSorting);
export const attributionViewSorting = Object.values(
  text.attributionViewSorting,
);
export const AUDIT_VIEW_DEFAULT_SORTING = text.auditViewSorting.byOccurrence;
export const ATTRIBUTION_VIEW_DEFAULT_SORTING =
  text.attributionViewSorting.alphabetical;

export type AuditViewSorting = (typeof auditViewSorting)[number];
export type AttributionViewSorting = (typeof attributionViewSorting)[number];

export const SORT_ICONS: Record<
  AuditViewSorting | AttributionViewSorting,
  React.ReactElement
> = {
  Alphabetically: <SortByAlphaIcon color={'action'} sx={baseIcon} />,
  'By Criticality': <CopyrightIcon color={'warning'} sx={baseIcon} />,
  'By Occurrence': <FormatListNumberedIcon color={'action'} sx={baseIcon} />,
};

export function useActiveSortingInAuditView() {
  const [activeSorting, setActiveSorting] = useVariable<AuditViewSorting>(
    'active-sorting-audit-view',
    AUDIT_VIEW_DEFAULT_SORTING,
  );

  return {
    activeSorting,
    setActiveSorting,
    isDefaultSortingActive: activeSorting === AUDIT_VIEW_DEFAULT_SORTING,
    options: useMemo(
      () =>
        auditViewSorting.map<MenuItem>((sorting) => ({
          name: sorting,
          value: sorting,
        })),
      [],
    ),
  };
}

export function useActiveSortingInAttributionView() {
  const [activeSorting, setActiveSorting] = useVariable<AttributionViewSorting>(
    'active-sorting-attribution-view',
    ATTRIBUTION_VIEW_DEFAULT_SORTING,
  );

  return {
    activeSorting,
    setActiveSorting,
    isDefaultSortingActive: activeSorting === ATTRIBUTION_VIEW_DEFAULT_SORTING,
    options: useMemo(
      () =>
        attributionViewSorting.map<SelectMenuOption>((sorting) => ({
          id: sorting,
          label: sorting,
          selected: sorting === activeSorting,
          icon: SORT_ICONS[sorting],
          onAdd: () => setActiveSorting(sorting),
        })),
      [activeSorting, setActiveSorting],
    ),
  };
}
