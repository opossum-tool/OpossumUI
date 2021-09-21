// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  FollowUp,
  FrequentLicences,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  clickOnCheckbox,
  getParsedInputFile,
} from '../../../test-helpers/test-helpers';
import { ReportView } from '../ReportView';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setFrequentLicences } from '../../../state/actions/resource-actions/all-views-simple-actions';

describe('The ReportView', () => {
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

  test('renders', () => {
    const testFrequentLicenses: FrequentLicences = {
      nameOrder: ['MIT', 'GPL'],
      texts: { MIT: 'MIT text', GPL: 'GPL text' },
    };
    const { getByText, store } = renderComponentWithStore(<ReportView />);
    store.dispatch(
      loadFromFile(
        getParsedInputFile(
          { ['test resource']: 1 },
          testManualAttributions,
          testResourcesToManualAttributions
        )
      )
    );
    store.dispatch(setFrequentLicences(testFrequentLicenses));
    expect(getByText('Test package'));
    expect(getByText('MIT text'));
    expect(getByText('Test other package'));
    expect(getByText('Some other license text'));
  });

  test('filters Follow-ups', () => {
    const { queryByText, getByText, store } = renderComponentWithStore(
      <ReportView />
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFile(
          { ['test resource']: 1 },
          testManualAttributions,
          testResourcesToManualAttributions
        )
      )
    );
    expect(getByText('Test package'));
    expect(getByText('Test other package'));

    clickOnCheckbox(screen, 'Show only follow-up (1)');

    expect(getByText('Test other package'));
    expect(queryByText('Test package')).toBe(null);
  });

  test('filters Follow-ups such that nothing left still shows checkbox', () => {
    const { queryByText, getByText, store } = renderComponentWithStore(
      <ReportView />
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFile(
          { ['test resource']: 1 },
          { [testManualUuid]: testManualAttributions[testManualUuid] },
          testResourcesToManualAttributions
        )
      )
    );
    expect(getByText('Test package'));

    clickOnCheckbox(screen, 'Show only follow-up (0)');
    expect(queryByText('Test package')).toBe(null);

    clickOnCheckbox(screen, 'Show only follow-up (0)');
    expect(getByText('Test package'));
  });
});
