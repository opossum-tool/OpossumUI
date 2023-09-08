// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Criticality } from '../../../../../shared/shared-types';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import {
  getLocatePopupSelectedCriticality,
  getLocatePopupSelectedLicenses,
} from '../../../selectors/locate-popup-selectors';
import {
  setLocatePopupSelectedCriticality,
  setLocatePopupSelectedLicenses,
} from '../locate-popup-actions';

describe('The locatePopup actions', () => {
  it('sets and gets selected criticality', () => {
    const testStore = createTestAppStore();
    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe('any');

    testStore.dispatch(setLocatePopupSelectedCriticality(Criticality.High));
    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      Criticality.High,
    );
  });

  it('sets and gets selected licenses', () => {
    const testStore = createTestAppStore();
    expect(getLocatePopupSelectedLicenses(testStore.getState()).size).toBe(0);

    testStore.dispatch(
      setLocatePopupSelectedLicenses(new Set<string>(['testLicenseId'])),
    );
    expect(getLocatePopupSelectedLicenses(testStore.getState())).toEqual(
      new Set<string>(['testLicenseId']),
    );
  });
});
