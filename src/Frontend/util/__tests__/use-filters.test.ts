// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions, FollowUp } from '../../../shared/shared-types';
import { FilterType } from '../../enums/enums';
import { updateActiveFilters } from '../../state/actions/view-actions/view-actions';
import { renderHook } from '../../test-helpers/render-component-with-store';
import { useFilters } from '../use-filters';

describe('useFollowUpFilter', () => {
  const testManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120002';
  const testOtherManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120003';
  const testManualAttributions: Attributions = {};
  testManualAttributions[testManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some comment',
    packageName: 'Test package',
    packageVersion: '1.0',
    copyright: 'Copyright John Doe',
    licenseText: 'Some license text',
    firstParty: true,
  };
  testManualAttributions[testOtherManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some other comment',
    packageName: 'Test other package',
    packageVersion: '2.0',
    copyright: 'other Copyright John Doe',
    licenseText: 'Some other license text',
    followUp: FollowUp,
    needsReview: true,
    preferred: true,
  };

  it('returns working getFilteredAttributions with follow-up filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [updateActiveFilters(FilterType.OnlyFollowUp)],
    });
    expect(result.current).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions without filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions));
    expect(result.current).toBe(testManualAttributions);
  });

  it('returns working getFilteredAttributions with only first party filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [updateActiveFilters(FilterType.OnlyFirstParty)],
    });
    expect(result.current).toEqual({
      [testManualUuid]: testManualAttributions[testManualUuid],
    });
  });

  it('returns working getFilteredAttributions with hide first party filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [updateActiveFilters(FilterType.HideFirstParty)],
    });
    expect(result.current).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions with only first party and follow up filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [
        updateActiveFilters(FilterType.OnlyFirstParty),
        updateActiveFilters(FilterType.OnlyFollowUp),
      ],
    });
    expect(result.current).toEqual({});
  });

  it('returns working getFilteredAttributions with hide first party and follow up filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [
        updateActiveFilters(FilterType.HideFirstParty),
        updateActiveFilters(FilterType.OnlyFollowUp),
      ],
    });
    expect(result.current).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions with only needs review filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [updateActiveFilters(FilterType.OnlyNeedsReview)],
    });
    expect(result.current).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions with only preferred filter', () => {
    const { result } = renderHook(() => useFilters(testManualAttributions), {
      actions: [updateActiveFilters(FilterType.OnlyPreferred)],
    });
    expect(result.current).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });
});
