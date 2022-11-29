// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { act, screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  FollowUp,
  FrequentLicenses,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  clickOnFilter,
  getParsedInputFileEnrichedWithTestData,
  openDropDown,
} from '../../../test-helpers/general-test-helpers';
import { ReportView } from '../ReportView';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setFrequentLicenses } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { FilterType } from '../../../enums/enums';

describe('The ReportView', () => {
  const testResources: Resources = { ['test resource']: 1 };
  const testManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120002';
  const testOtherManualUuid = 'a32f2f96-f40e-11ea-adc1-0242ac120003';
  const testManualAttributions: Attributions = {};
  const testResourcesToManualAttributions: ResourcesToAttributions = {};
  testManualAttributions[testManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some comment',
    packageName: 'Test package',
    packageVersion: '1.0',
    copyright: 'Copyright John Doe',
    licenseName: 'MIT',
    firstParty: true,
  };
  testResourcesToManualAttributions['test resource'] = [testManualUuid];
  testManualAttributions[testOtherManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some other comment',
    packageName: 'Test other package',
    packageVersion: '2.0',
    copyright: 'other Copyright John Doe',
    licenseText: 'Some other license text',
    followUp: FollowUp,
    excludeFromNotice: true,
  };
  testResourcesToManualAttributions['test other resource'] = [
    testOtherManualUuid,
  ];

  it('renders', () => {
    const testFrequentLicenses: FrequentLicenses = {
      nameOrder: ['MIT', 'GPL'],
      texts: { MIT: 'MIT text', GPL: 'GPL text' },
    };
    const { store } = renderComponentWithStore(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          })
        )
      );
      store.dispatch(setFrequentLicenses(testFrequentLicenses));
    });
    expect(screen.getByText(/Attributions \(2 total, 1, 0, 0/));
    expect(screen.getByText('Test package'));
    expect(screen.getByText('MIT text'));
    expect(screen.getByText('Test other package'));
    expect(screen.getByText('Some other license text'));
  });

  it('filters Follow-ups', () => {
    const { store } = renderComponentWithStore(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          })
        )
      );
    });
    expect(screen.getByText(/Attributions \(2 total, 1, 0, 0/));
    expect(screen.getByText('Test package'));
    expect(screen.getByText('Test other package'));

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFollowUp);

    expect(screen.getByText('Test other package'));
    expect(screen.queryByText('Test package')).not.toBeInTheDocument();
  });

  it('filters only first party', () => {
    const { store } = renderComponentWithStore(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          })
        )
      );
    });
    expect(screen.getByText(/Attributions \(2 total, 1, 0, 0/));
    expect(screen.getByText('Test package'));
    expect(screen.getByText('Test other package'));

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFirstParty);

    expect(screen.getByText('Test package'));
    expect(screen.queryByText('Test other package')).not.toBeInTheDocument();

    clickOnFilter(screen, FilterType.OnlyFirstParty);
    expect(screen.getByText('Test package'));
    expect(screen.getByText('Test other package'));
  });

  it('filters Only First Party and follow ups and then hide first party and follow ups', () => {
    const { store } = renderComponentWithStore(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          })
        )
      );
    });
    expect(screen.getByText(/Attributions \(2 total, 1, 0, 0/));
    expect(screen.getByText('Test package'));
    expect(screen.getByText('Test other package'));

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFirstParty);
    clickOnFilter(screen, FilterType.OnlyFollowUp);

    expect(screen.queryByText('Test package')).not.toBeInTheDocument();
    expect(screen.queryByText('Test other package')).not.toBeInTheDocument();

    clickOnFilter(screen, FilterType.HideFirstParty);

    expect(screen.getByText('Test other package'));
    expect(screen.queryByText('Test package')).not.toBeInTheDocument();
  });
});
