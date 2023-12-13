// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../../shared/shared-types';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { createAppStore } from '../../../configure-store';
import { getResourcesWithLocatedAttributions } from '../../../selectors/all-views-resource-selectors';
import { getLocatePopupFilters } from '../../../selectors/locate-popup-selectors';
import { loadFromFile } from '../load-actions';
import { setLocatePopupFilters } from '../locate-popup-actions';

describe('The locatePopup actions', () => {
  it('sets and gets filters and thus located resources (in reducer)', () => {
    const testStore = createAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'GPL-2.0',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder/file': ['uuid1'],
    };

    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set<string>(),
      searchTerm: '',
      searchOnlyLicenseName: false,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual({
      resourcesWithLocatedChildren: new Set(),
      locatedResources: new Set(),
    });

    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );
    testStore.dispatch(
      setLocatePopupFilters({
        selectedCriticality: SelectedCriticality.High,
        selectedLicenses: new Set<string>(['GPL-2.0']),
        searchTerm: 'gpl',
        searchOnlyLicenseName: true,
      }),
    );

    expect(getLocatePopupFilters(testStore.getState())).toEqual({
      selectedCriticality: SelectedCriticality.High,
      selectedLicenses: new Set<string>(['GPL-2.0']),
      searchTerm: 'gpl',
      searchOnlyLicenseName: true,
    });
    expect(getResourcesWithLocatedAttributions(testStore.getState())).toEqual({
      resourcesWithLocatedChildren: new Set<string>(['/', '/folder/']),
      locatedResources: new Set<string>(['/folder/file']),
    });
  });
});
