// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { getLocatePopupSelectedCriticality } from '../../../state/selectors/locate-popup-selectors';
import { clickOnButton } from '../../../test-helpers/general-test-helpers';
import { setLocatePopupSelectedCriticality } from '../../../state/actions/resource-actions/locate-popup-actions';
import { SelectedCriticality } from '../../../../shared/shared-types';
import { getLicenseNames, LocatorPopup } from '../LocatorPopup';
import { getLocatePopupSelectedLicenses } from '../../../state/selectors/locate-popup-selectors';
import { expectElementsInAutoCompleteAndSelectFirst } from '../../../test-helpers/general-test-helpers';
import { setExternalData } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  Attributions,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { setLocatePopupSelectedLicenses } from '../../../state/actions/resource-actions/locate-popup-actions';

describe('Locator popup ', () => {
  jest.useFakeTimers();

  it('renders', () => {
    renderComponentWithStore(<LocatorPopup />);
    expect(
      screen.getByText('Locate Signals', { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Criticality')).toBeInTheDocument();
    expect(screen.getByText('Any')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'License' }),
    ).toBeInTheDocument();
  });

  it('selects criticality values using the dropdown', () => {
    const testStore = createTestAppStore();
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    fireEvent.mouseDown(screen.getByText('Any').childNodes[0] as Element);

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();

    fireEvent.click(screen.getByText('High').parentNode as Element);

    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      SelectedCriticality.Any,
    );

    clickOnButton(screen, 'Apply');

    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      SelectedCriticality.High,
    );
  });

  it('resets criticality using the Clear button', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupSelectedCriticality(SelectedCriticality.Medium),
    );
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expect(screen.getByText('Medium')).toBeInTheDocument();

    clickOnButton(screen, 'Clear');

    expect(screen.getByText('Any')).toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();

    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      SelectedCriticality.Any,
    );
  });

  it('sets state if license selected', () => {
    const testStore = createTestAppStore();
    // add external attribution with license MIT to see it
    const testExternalAttribution: PackageInfo = {
      packageName: 'jQuery',
      packageVersion: '16.0.0',
      licenseName: 'MIT',
      comment: 'ManualPackage',
    };
    const testExternalAttributions: Attributions = {
      uuid_1: testExternalAttribution,
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/': ['uuid_1'],
    };

    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions,
      ),
    );
    const licenseSet = new Set(['MIT']);

    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expectElementsInAutoCompleteAndSelectFirst(screen, ['MIT']);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }) as Element);
    expect(getLocatePopupSelectedLicenses(testStore.getState())).toEqual(
      licenseSet,
    );
  });

  it('clears license field if clear button pressed', () => {
    const testStore = createTestAppStore();

    const licenseSet = new Set(['MIT']);
    testStore.dispatch(setLocatePopupSelectedLicenses(licenseSet));

    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }) as Element);
    expect(getLocatePopupSelectedLicenses(testStore.getState())).toEqual(
      new Set(),
    );
  });

  it('shows license if selected beforehand', () => {
    const testStore = createTestAppStore();

    const licenseSet = new Set(['MIT']);
    testStore.dispatch(setLocatePopupSelectedLicenses(licenseSet));

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    expect(screen.getByDisplayValue('MIT')).toBeInTheDocument();
  });
});

describe('getLicenseNamesFromExternalAttributions', () => {
  it('collects the correct license names', () => {
    const testExternalMITAttribution: PackageInfo = {
      licenseName: 'MIT',
    };
    const testExternalApacheAttribution: PackageInfo = {
      licenseName: 'Apache-2.0',
    };

    const testExternalAttributions: Attributions = {
      uuid_1: testExternalMITAttribution,
      uuid_2: testExternalApacheAttribution,
    };

    const licenseNames = getLicenseNames(testExternalAttributions);
    const expectedLicenseNames = ['MIT', 'Apache-2.0'];
    expect(licenseNames).toEqual(expectedLicenseNames);
  });
});
