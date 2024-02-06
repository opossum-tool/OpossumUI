// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Attributions,
  FrequentLicenses,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { setFrequentLicenses } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  getParsedInputFileEnrichedWithTestData,
  selectFilter,
} from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ReportView } from '../ReportView';

describe('The ReportView', () => {
  const testResources: Resources = { 'test resource': 1 };
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
    id: testManualUuid,
  };
  testResourcesToManualAttributions['test resource'] = [testManualUuid];
  testManualAttributions[testOtherManualUuid] = {
    attributionConfidence: 0,
    comment: 'Some other comment',
    packageName: 'Test other package',
    packageVersion: '2.0',
    copyright: 'other Copyright John Doe',
    licenseText: 'Some other license text',
    followUp: true,
    excludeFromNotice: true,
    id: testOtherManualUuid,
  };
  testResourcesToManualAttributions['test other resource'] = [
    testOtherManualUuid,
  ];

  it('renders', () => {
    const testFrequentLicenses: FrequentLicenses = {
      nameOrder: [
        { shortName: 'MIT', fullName: 'MIT license' },
        {
          shortName: 'GPL',
          fullName: 'General Public License',
        },
      ],
      texts: { MIT: 'MIT text', GPL: 'GPL text' },
    };
    const { store } = renderComponent(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          }),
        ),
      );
      store.dispatch(setFrequentLicenses(testFrequentLicenses));
    });
    expect(
      screen.getByText(/Attributions \(2 total, 0, 1, 0, 0/),
    ).toBeInTheDocument();
    expect(screen.getByText('Test package')).toBeInTheDocument();
    expect(screen.getByText('MIT text')).toBeInTheDocument();
    expect(screen.getByText('Test other package')).toBeInTheDocument();
    expect(screen.getByText('Some other license text')).toBeInTheDocument();
  });

  it('filters Follow-ups', async () => {
    const { store } = renderComponent(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          }),
        ),
      );
    });
    expect(
      screen.getByText(/Attributions \(2 total, 0, 1, 0, 0/),
    ).toBeInTheDocument();
    expect(screen.getByText('Test package')).toBeInTheDocument();
    expect(screen.getByText('Test other package')).toBeInTheDocument();

    await selectFilter(screen, 'Needs Follow-Up');

    expect(screen.getByText('Test other package')).toBeInTheDocument();
    expect(screen.queryByText('Test package')).not.toBeInTheDocument();
  });

  it('filters only first party', async () => {
    const { store } = renderComponent(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          }),
        ),
      );
    });
    expect(
      screen.getByText(/Attributions \(2 total, 0, 1, 0, 0/),
    ).toBeInTheDocument();
    expect(screen.getByText('Test package')).toBeInTheDocument();
    expect(screen.getByText('Test other package')).toBeInTheDocument();

    await selectFilter(screen, 'First Party');

    expect(screen.getByText('Test package')).toBeInTheDocument();
    expect(screen.queryByText('Test other package')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('clear button'));
    expect(screen.getByText('Test package')).toBeInTheDocument();
    expect(screen.getByText('Test other package')).toBeInTheDocument();
  });

  it('filters Only First Party and follow ups and then hide first party and follow ups', async () => {
    const { store } = renderComponent(<ReportView />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          }),
        ),
      );
    });
    expect(
      screen.getByText(/Attributions \(2 total, 0, 1, 0, 0/),
    ).toBeInTheDocument();
    expect(screen.getByText('Test package')).toBeInTheDocument();
    expect(screen.getByText('Test other package')).toBeInTheDocument();

    await selectFilter(screen, 'First Party');
    await selectFilter(screen, 'Needs Follow-Up');

    expect(screen.queryByText('Test package')).not.toBeInTheDocument();
    expect(screen.queryByText('Test other package')).not.toBeInTheDocument();
  });
});
