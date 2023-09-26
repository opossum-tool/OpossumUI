// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SelectedCriticality } from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import { setLocatePopupFilters } from '../../actions/resource-actions/locate-popup-actions';
import { isLocateSignalActive } from '../locate-popup-selectors';

describe('isLocateSignalActive', () => {
  it('returns false in the default state', () => {
    const testStore = createTestAppStore();
    expect(!isLocateSignalActive(testStore.getState()));
  });

  it('returns true if the selected criticality is not the default', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.High,
        selectedLicenses: new Set<string>(),
      }),
    );

    expect(isLocateSignalActive(testStore.getState()));
  });

  it('returns true if there are selected licenses', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(['testLicenseId']),
      }),
    );
    expect(isLocateSignalActive(testStore.getState()));
  });
});
