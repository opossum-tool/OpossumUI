// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { setResolvedExternalAttributions } from '../../actions/resource-actions/audit-view-simple-actions';
import { createAppStore } from '../../configure-store';
import { getResolvedExternalAttributions } from '../resource-selectors';

describe('The audit view resource selectors', () => {
  it('sets and gets resolvedExternalAttributions', () => {
    const testStore = createAppStore();
    const testResolvedExternalAttributions: Set<string> = new Set();
    testResolvedExternalAttributions
      .add('d3a753c0-5100-11eb-ae93-0242ac130002')
      .add('d3a7565e-5100-11eb-ae93-0242ac130002');

    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      new Set(),
    );

    testStore.dispatch(
      setResolvedExternalAttributions(testResolvedExternalAttributions),
    );
    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      testResolvedExternalAttributions,
    );
  });
});
