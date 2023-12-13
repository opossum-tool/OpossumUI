// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SelectedCriticality } from '../../../../shared/shared-types';
import { setLocatePopupFilters } from '../../actions/resource-actions/locate-popup-actions';
import { createAppStore } from '../../configure-store';
import { isLocateSignalActive } from '../locate-popup-selectors';

describe('isLocateSignalActive', () => {
  it('returns false in the default state', () => {
    const testStore = createAppStore();
    expect(!isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns true if the selected criticality is not the default', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.High,
        selectedLicenses: new Set<string>(),
        searchTerm: '',
        searchOnlyLicenseName: false,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns true if there are selected licenses', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(['testLicenseId']),
        searchTerm: '',
        searchOnlyLicenseName: false,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns true if the search term is set', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(),
        searchTerm: 'testSearchterm',
        searchOnlyLicenseName: false,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(true);
  });

  it('returns false if only searchOnlyLicenseName is set', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set<string>(),
        searchTerm: '',
        searchOnlyLicenseName: true,
      }),
    );

    expect(isLocateSignalActive(testStore.getState())).toEqual(false);
  });
});
