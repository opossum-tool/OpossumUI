// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import {
  Attributions,
  Criticality,
  FrequentLicenses,
  PackageInfo,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../shared/shared-types';
import {
  setExternalData,
  setFrequentLicenses,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setLocatePopupFilters } from '../../../state/actions/resource-actions/locate-popup-actions';
import { getResourcesWithLocatedAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { getLocatePopupFilters } from '../../../state/selectors/locate-popup-selectors';
import {
  clickOnButton,
  expectElementsInAutoCompleteAndSelectFirst,
} from '../../../test-helpers/general-test-helpers';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { LocatorPopup } from '../LocatorPopup';

describe('Locator popup ', () => {
  jest.useFakeTimers();

  it('renders', () => {
    renderComponentWithStore(<LocatorPopup />);
    expect(
      screen.getByText('Locate Signals', { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByText('Only search license names')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: 'checkbox Only search license names',
      }),
    ).not.toBeChecked();
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

    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set<string>(),
      searchTerm: '',
      searchOnlyLicenseName: false,
    });

    clickOnButton(screen, 'Apply');

    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedCriticality: SelectedCriticality.High,
      selectedLicenses: new Set<string>(),
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
  });

  it('resets criticality using the Clear button', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Medium,
        selectedLicenses: new Set<string>(),
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expect(screen.getByText('Medium')).toBeInTheDocument();

    clickOnButton(screen, 'Clear');

    expect(screen.getByText('Any')).toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();

    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set<string>(),
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
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
    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/']),
      locatedResources: new Set(['/root/']),
    };

    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expectElementsInAutoCompleteAndSelectFirst(screen, ['MIT']);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }) as Element);
    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: licenseSet,
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );
  });

  it('sets state if several licenses selected', () => {
    const testStore = createTestAppStore();
    const testExternalAttribution: PackageInfo = {
      packageName: 'jQuery',
      packageVersion: '16.0.0',
      licenseName: 'MIT',
      comment: 'ManualPackage',
    };
    const otherTestExternalAttribution: PackageInfo = {
      packageName: 'jQuery',
      packageVersion: '16.0.0',
      licenseName: 'GPL-2.0',
      comment: 'ManualPackage',
    };
    const testExternalAttributions: Attributions = {
      uuid_1: testExternalAttribution,
      uuid_2: otherTestExternalAttribution,
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/': ['uuid_1', 'uuid_2'],
    };

    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions,
      ),
    );
    const licenseSet = new Set(['MIT', 'GPL-2.0']);
    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/']),
      locatedResources: new Set(['/root/']),
    };

    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expectElementsInAutoCompleteAndSelectFirst(screen, ['MIT']);
    expectElementsInAutoCompleteAndSelectFirst(screen, ['GPL-2.0']);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }) as Element);
    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      searchOnlyLicenseName: false,
      searchTerm: '',
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: licenseSet,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );
  });

  it('clears license field if clear button pressed', () => {
    const testStore = createTestAppStore();

    const licenseSet = new Set(['MIT']);
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: licenseSet,
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }) as Element);
    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedLicenses: new Set<string>(),
      selectedCriticality: SelectedCriticality.Any,
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual({
      resourcesWithLocatedChildren: new Set(),
      locatedResources: new Set(),
    });
  });

  it('clears search field if clear button pressed', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Medium,
        selectedLicenses: new Set<string>(),
        searchOnlyLicenseName: false,
        searchTerm: 'jquery',
      }),
    );
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }) as Element);

    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedLicenses: new Set<string>(),
      selectedCriticality: SelectedCriticality.Any,
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual({
      resourcesWithLocatedChildren: new Set(),
      locatedResources: new Set(),
    });
  });

  it('unchecks checkbox if clear button pressed', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Medium,
        selectedLicenses: new Set<string>(),
        searchOnlyLicenseName: true,
        searchTerm: '',
      }),
    );
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expect(
      screen.getByRole('checkbox', {
        name: 'checkbox Only search license names',
      }),
    ).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }) as Element);

    expect(
      screen.getByRole('checkbox', {
        name: 'checkbox Only search license names',
      }),
    ).not.toBeChecked();
    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedLicenses: new Set<string>(),
      selectedCriticality: SelectedCriticality.Any,
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual({
      resourcesWithLocatedChildren: new Set(),
      locatedResources: new Set(),
    });
  });

  it('shows license if selected beforehand', () => {
    const testStore = createTestAppStore();

    const licenseSet = new Set(['MIT']);
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: licenseSet,
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });
});

describe('locateResourcesByCriticalityAndLicense', () => {
  const testAttributions: Attributions = {
    MITHighAttribution: {
      licenseName: 'MIT',
      criticality: Criticality.High,
    },
    MITMediumAttribution: {
      licenseName: 'MIT',
      criticality: Criticality.Medium,
    },
    ApacheHighAttribution: {
      licenseName: 'Apache-2.0',
      criticality: Criticality.High,
    },
    ApacheMediumAttribution: {
      licenseName: 'Apache-2.0',
      criticality: Criticality.Medium,
    },
    GPLMediumAttribution: {
      licenseName: 'General Public License',
      criticality: Criticality.Medium,
      packageVersion: '2.0',
    },
  };
  const testResourcesToAttributions: ResourcesToAttributions = {
    '/pathToMITHigh/': ['MITHighAttribution'],
    '/pathToMITHigh/pathToMITMedium': ['MITMediumAttribution'],
    '/pathToApacheHigh': ['ApacheHighAttribution'],
    '/pathToApacheMedium': ['ApacheMediumAttribution'],
    '/pathToGPLMedium': ['GPLMediumAttribution'],
  };
  const testFrequentLicenses: FrequentLicenses = {
    nameOrder: [
      {
        shortName: 'GPL',
        fullName: 'General Public License',
      },
    ],
    texts: {
      GPL: 'GPL license text',
      'General Public License': 'GPL license text',
    },
  };

  it('locates attribution and parent if criticality and licenses are set', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const criticality = SelectedCriticality.Medium;
    const licenseNames = new Set(['MIT']);

    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: criticality,
        selectedLicenses: licenseNames,
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/', '/pathToMITHigh/']),
      locatedResources: new Set(['/pathToMITHigh/pathToMITMedium']),
    };
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );
  });

  it('locates attribution and parent if only search term set', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const searchTerm = '2.0';
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set(),
        searchOnlyLicenseName: false,
        searchTerm,
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/']),
      locatedResources: new Set([
        '/pathToApacheHigh',
        '/pathToApacheMedium',
        '/pathToGPLMedium',
      ]),
    };
    const actualLocatedResources = getResourcesWithLocatedAttributions(
      testStore.getState(),
    );
    expect(actualLocatedResources).toEqual(expectedLocatedResources);
  });

  it('locates attribution and parent when searching for license name only', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const searchTerm = '2.0';
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: new Set(),
        searchOnlyLicenseName: true,
        searchTerm,
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/']),
      locatedResources: new Set(['/pathToApacheHigh', '/pathToApacheMedium']),
    };
    const actualLocatedResources = getResourcesWithLocatedAttributions(
      testStore.getState(),
    );
    expect(actualLocatedResources).toEqual(expectedLocatedResources);
  });

  it('locates attribution and parent if only licenses set', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const licenseNames = new Set(['MIT']);
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: licenseNames,
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/', '/pathToMITHigh/']),
      locatedResources: new Set([
        '/pathToMITHigh/',
        '/pathToMITHigh/pathToMITMedium',
      ]),
    };
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );
  });

  it('locates attribution and parent if only criticality is set', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const criticality = SelectedCriticality.Medium;
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: criticality,
        selectedLicenses: new Set<string>(),
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/', '/pathToMITHigh/']),
      locatedResources: new Set([
        '/pathToMITHigh/pathToMITMedium',
        '/pathToApacheMedium',
        '/pathToGPLMedium',
      ]),
    };
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );
  });

  it('locates full name attribution if license is set to frequent license', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const criticality = SelectedCriticality.Medium;
    const licenseNames = new Set(['GPL']);
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: criticality,
        selectedLicenses: licenseNames,
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set(['/']),
      locatedResources: new Set(['/pathToGPLMedium']),
    };

    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );
  });

  it('shows message when filters are set, but no signals are located', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions),
    );
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));

    const criticality = SelectedCriticality.High;
    const licenseNames = new Set(['General Public License']);
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: criticality,
        selectedLicenses: licenseNames,
        searchOnlyLicenseName: false,
        searchTerm: '',
      }),
    );

    renderComponentWithStore(<LocatorPopup />, { store: testStore });
    clickOnButton(screen, 'Apply');

    const expectedLocatedResources = {
      resourcesWithLocatedChildren: new Set([]),
      locatedResources: new Set([]),
    };
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual(
      expectedLocatedResources,
    );

    expect(
      screen.getByText('No signals located. Please adjust filters or cancel.', {
        exact: true,
      }),
    );
  });
});
