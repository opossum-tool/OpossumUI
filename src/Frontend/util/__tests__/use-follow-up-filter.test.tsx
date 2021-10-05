// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act } from '@testing-library/react';
import React from 'react';
import { Attributions, FollowUp } from '../../../shared/shared-types';
import { useFollowUpFilter } from '../use-follow-up-filter';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';

describe('useFollowUpFilter', () => {
  let hookResult: ReturnType<typeof useFollowUpFilter>;

  const TestComponent: React.FunctionComponent = () => {
    hookResult = useFollowUpFilter();
    return null;
  };

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
  };
  testManualAttributions[testOtherManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some other comment',
    packageName: 'Test other package',
    packageVersion: '2.0',
    copyright: 'other Copyright John Doe',
    licenseText: 'Some other license text',
    followUp: FollowUp,
  };

  test('returns working handleFilterChange', () => {
    renderComponentWithStore(<TestComponent />);

    expect(hookResult.filterForFollowUp).toBe(false);
    act(() => {
      hookResult.handleFilterChange();
    });
    expect(hookResult.filterForFollowUp).toBe(true);
    act(() => {
      hookResult.handleFilterChange();
    });
    expect(hookResult.filterForFollowUp).toBe(false);
  });

  test('returns working getFilteredAttributions', () => {
    renderComponentWithStore(<TestComponent />);

    expect(hookResult.filterForFollowUp).toBe(false);
    let filteredAttributions = hookResult.getFilteredAttributions(
      testManualAttributions
    );
    expect(filteredAttributions).toBe(testManualAttributions);

    act(() => {
      hookResult.handleFilterChange();
    });
    expect(hookResult.filterForFollowUp).toBe(true);
    filteredAttributions = hookResult.getFilteredAttributions(
      testManualAttributions
    );
    expect(filteredAttributions).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });
});
