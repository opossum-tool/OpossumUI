// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { FilterType } from '../../enums/enums';

const mutuallyExclusiveFilters = [
  [FilterType.OnlyFirstParty, FilterType.HideFirstParty],
];

export function getUpdatedFilters(
  activeFilters: Set<FilterType>,
  newFilter: FilterType
): Set<FilterType> {
  const currentFilters = new Set(activeFilters);
  if (currentFilters.has(newFilter)) {
    currentFilters.delete(newFilter);
  } else {
    const filtersToRemove = getFiltersToRemove(newFilter);
    if (filtersToRemove.size !== 0) {
      filtersToRemove.forEach((element) => currentFilters.delete(element));
    }
    currentFilters.add(newFilter);
  }
  return currentFilters;
}

export function getFiltersToRemove(newFilter: FilterType): Set<FilterType> {
  return new Set(
    mutuallyExclusiveFilters
      .filter((filterPair) => filterPair.includes(newFilter))
      .map((filterPair) =>
        filterPair.indexOf(newFilter) ? filterPair[0] : filterPair[1]
      )
  );
}
