// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BarChartIcon from '@mui/icons-material/BarChart';
import CopyrightIcon from '@mui/icons-material/Copyright';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import { useMemo } from 'react';

import { text } from '../../../shared/text';
import { MenuItem } from '../../Components/InputElements/Dropdown';
import { SelectMenuOption } from '../../Components/SelectMenu/SelectMenu';
import {
  attributionDefaultSorting,
  signalDefaultSorting,
  Sorting,
  sortings,
} from '../../shared-constants';
import { baseIcon } from '../../shared-styles';
import { useVariable } from './use-variable';

export const SIGNAL_SORTING = 'signal-sorting';
export const ATTRIBUTION_SORTING = 'attribution-sorting';

export const SORT_ICONS: Record<Sorting, React.ReactElement> = {
  [text.sortings.name]: <SortByAlphaIcon color={'action'} sx={baseIcon} />,
  [text.sortings.criticality]: (
    <CopyrightIcon color={'warning'} sx={baseIcon} />
  ),
  [text.sortings.occurrence]: <BarChartIcon color={'action'} sx={baseIcon} />,
};

export function useSignalSorting() {
  const [signalSorting, setSignalSorting] = useVariable<Sorting>(
    SIGNAL_SORTING,
    signalDefaultSorting,
  );

  return {
    signalSorting,
    setSignalSorting,
    options: useMemo(
      () =>
        sortings.map<MenuItem>((sorting) => ({
          name: sorting,
          value: sorting,
        })),
      [],
    ),
  };
}

export function useAttributionSorting() {
  const [attributionSorting, setAttributionSorting] = useVariable<Sorting>(
    ATTRIBUTION_SORTING,
    attributionDefaultSorting,
  );

  return {
    attributionSorting,
    setAttributionSorting,
    options: useMemo(
      () =>
        sortings.map<SelectMenuOption>((sorting) => ({
          id: sorting,
          label: sorting,
          selected: sorting === attributionSorting,
          icon: SORT_ICONS[sorting],
          onAdd: () => setAttributionSorting(sorting),
        })),
      [attributionSorting, setAttributionSorting],
    ),
  };
}
