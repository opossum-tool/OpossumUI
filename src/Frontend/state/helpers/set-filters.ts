// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsFilterType } from '../../enums/enums';

const mutuallyExclusiveFilters = [
  [
    AttributionsFilterType.OnlyFirstParty,
    AttributionsFilterType.HideFirstParty,
  ],
];

export function getUpdatedFilters(
  activeFilters: Set<AttributionsFilterType>,
  newFilter: AttributionsFilterType
): Set<AttributionsFilterType> {
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

export function getFiltersToRemove(
  newFilter: AttributionsFilterType
): Set<AttributionsFilterType> {
  return new Set(
    mutuallyExclusiveFilters
      .filter((filterPair) => filterPair.includes(newFilter))
      .map((filterPair) =>
        filterPair.indexOf(newFilter) ? filterPair[0] : filterPair[1]
      )
  );
}
