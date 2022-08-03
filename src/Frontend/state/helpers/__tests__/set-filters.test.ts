// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { FilterType } from '../../../enums/enums';
import { getFiltersToRemove, getUpdatedFilters } from '../set-filters';

describe('The getUpdatedFilters function', () => {
  it('adds non-existing filter', () => {
    const activeFilters = new Set([FilterType.OnlyFollowUp]);
    const expectedFilters = new Set([
      FilterType.OnlyFollowUp,
      FilterType.HideFirstParty,
    ]);
    expect(getUpdatedFilters(activeFilters, FilterType.HideFirstParty)).toEqual(
      expectedFilters
    );
  });

  it('remove existing filter', () => {
    const activeFilters = new Set([
      FilterType.OnlyFollowUp,
      FilterType.HideFirstParty,
    ]);
    const expectedFilters = new Set([FilterType.OnlyFollowUp]);
    expect(getUpdatedFilters(activeFilters, FilterType.HideFirstParty)).toEqual(
      expectedFilters
    );
  });
});

describe('The getFiltersToRemove function', () => {
  it('returns only first party filter when the new filter is hide first party', () => {
    const filtersToRemove = new Set([FilterType.OnlyFirstParty]);
    expect(getFiltersToRemove(FilterType.HideFirstParty)).toEqual(
      filtersToRemove
    );
  });

  it('returns hide first party filter when the new filter is only first party', () => {
    const filtersToRemove = new Set([FilterType.HideFirstParty]);
    expect(getFiltersToRemove(FilterType.OnlyFirstParty)).toEqual(
      filtersToRemove
    );
  });

  it('returns no filter when the new filter is only follow up', () => {
    const filtersToRemove = new Set();
    expect(getFiltersToRemove(FilterType.OnlyFollowUp)).toEqual(
      filtersToRemove
    );
  });
});
