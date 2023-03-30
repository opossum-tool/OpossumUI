// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { Attributions, FollowUp } from '../../../shared/shared-types';
import { useFilters } from '../use-filters';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../test-helpers/render-component-with-store';
import { updateActiveFilters } from '../../state/actions/view-actions/view-actions';
import { AttributionsFilterType } from '../../enums/enums';

let filteredAttributions: Attributions;

function TestComponent(props: {
  manualAttributions: Attributions;
}): ReactElement {
  filteredAttributions = useFilters(props.manualAttributions);
  return <div />;
}

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
  };

  it('returns working getFilteredAttributions with follow-up filter', () => {
    const store = createTestAppStore();
    store.dispatch(updateActiveFilters(AttributionsFilterType.OnlyFollowUp));
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions without filter', () => {
    const store = createTestAppStore();
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toBe(testManualAttributions);
  });

  it('returns working getFilteredAttributions with only first party filter', () => {
    const store = createTestAppStore();
    store.dispatch(updateActiveFilters(AttributionsFilterType.OnlyFirstParty));
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toEqual({
      [testManualUuid]: testManualAttributions[testManualUuid],
    });
  });

  it('returns working getFilteredAttributions with hide first party filter', () => {
    const store = createTestAppStore();
    store.dispatch(updateActiveFilters(AttributionsFilterType.HideFirstParty));
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions with only first party and follow up filter', () => {
    const store = createTestAppStore();
    store.dispatch(updateActiveFilters(AttributionsFilterType.OnlyFirstParty));
    store.dispatch(updateActiveFilters(AttributionsFilterType.OnlyFollowUp));
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toEqual({});
  });

  it('returns working getFilteredAttributions with hide first party and follow up filter', () => {
    const store = createTestAppStore();
    store.dispatch(updateActiveFilters(AttributionsFilterType.HideFirstParty));
    store.dispatch(updateActiveFilters(AttributionsFilterType.OnlyFollowUp));
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });

  it('returns working getFilteredAttributions with only needs review filter', () => {
    const store = createTestAppStore();
    store.dispatch(updateActiveFilters(AttributionsFilterType.OnlyNeedsReview));
    renderComponentWithStore(
      <TestComponent manualAttributions={testManualAttributions} />,
      { store }
    );
    expect(filteredAttributions).toEqual({
      [testOtherManualUuid]: testManualAttributions[testOtherManualUuid],
    });
  });
});
