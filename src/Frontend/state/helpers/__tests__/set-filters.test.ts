// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsFilterType } from '../../../enums/enums';
import { getFiltersToRemove, getUpdatedFilters } from '../set-filters';

describe('The getUpdatedFilters function', () => {
  it('adds non-existing filter', () => {
    const activeFilters = new Set([AttributionsFilterType.OnlyFollowUp]);
    const expectedFilters = new Set([
      AttributionsFilterType.OnlyFollowUp,
      AttributionsFilterType.HideFirstParty,
    ]);
    expect(
      getUpdatedFilters(activeFilters, AttributionsFilterType.HideFirstParty)
    ).toEqual(expectedFilters);
  });

  it('remove existing filter', () => {
    const activeFilters = new Set([
      AttributionsFilterType.OnlyFollowUp,
      AttributionsFilterType.HideFirstParty,
    ]);
    const expectedFilters = new Set([AttributionsFilterType.OnlyFollowUp]);
    expect(
      getUpdatedFilters(activeFilters, AttributionsFilterType.HideFirstParty)
    ).toEqual(expectedFilters);
  });
});

describe('The getFiltersToRemove function', () => {
  it('returns only first party filter when the new filter is hide first party', () => {
    const filtersToRemove = new Set([AttributionsFilterType.OnlyFirstParty]);
    expect(getFiltersToRemove(AttributionsFilterType.HideFirstParty)).toEqual(
      filtersToRemove
    );
  });

  it('returns hide first party filter when the new filter is only first party', () => {
    const filtersToRemove = new Set([AttributionsFilterType.HideFirstParty]);
    expect(getFiltersToRemove(AttributionsFilterType.OnlyFirstParty)).toEqual(
      filtersToRemove
    );
  });

  it('returns no filter when the new filter is only follow up', () => {
    const filtersToRemove = new Set();
    expect(getFiltersToRemove(AttributionsFilterType.OnlyFollowUp)).toEqual(
      filtersToRemove
    );
  });
});
