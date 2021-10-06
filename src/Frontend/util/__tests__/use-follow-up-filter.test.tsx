// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { Attributions, FollowUp } from '../../../shared/shared-types';
import { provideFollowUpFilter } from '../provide-follow-up-filter';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import { useDispatch } from 'react-redux';

describe('useFollowUpFilter', () => {
  let hookResult: ReturnType<typeof provideFollowUpFilter>;

  const TestComponentWithFilter: React.FunctionComponent = () => {
    const dispatch = useDispatch();
    hookResult = provideFollowUpFilter(true, dispatch);
    return null;
  };

  const TestComponentWithoutFilter: React.FunctionComponent = () => {
    const dispatch = useDispatch();
    hookResult = provideFollowUpFilter(false, dispatch);
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

  test('returns working getFilteredAttributions with follow-up filter', () => {
    renderComponentWithStore(<TestComponentWithFilter />);

    expect(hookResult.filterForFollowUp).toBe(true);
    const filteredAttributions = hookResult.getFilteredAttributions(
      testManualAttributions
    );
    expect(filteredAttributions).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  test('returns working getFilteredAttributions without filter', () => {
    renderComponentWithStore(<TestComponentWithoutFilter />);

    expect(hookResult.filterForFollowUp).toBe(false);
    const filteredAttributions = hookResult.getFilteredAttributions(
      testManualAttributions
    );
    expect(filteredAttributions).toBe(testManualAttributions);
  });
});
