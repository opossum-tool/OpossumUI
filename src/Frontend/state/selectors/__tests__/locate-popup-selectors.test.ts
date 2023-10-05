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
    expect(!isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns true if the selected criticality is not the default', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.High,
        selectedLicenses: new Set<string>(),
        searchTerm: '',
        searchOnlyInLicenseField: false,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns true if there are selected licenses', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(['testLicenseId']),
        searchTerm: '',
        searchOnlyInLicenseField: false,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns true if the search term is set', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(),
        searchTerm: 'testSearchterm',
        searchOnlyInLicenseField: false,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns false if only searchOnlyInLicenseField is set', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(),
        searchTerm: '',
        searchOnlyInLicenseField: true,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(false);
  });
});
