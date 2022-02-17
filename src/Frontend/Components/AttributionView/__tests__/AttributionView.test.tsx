// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  FollowUp,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { FilterType, View } from '../../../enums/enums';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  clickOnFilter,
  getParsedInputFileEnrichedWithTestData,
  openDropDown,
} from '../../../test-helpers/general-test-helpers';
import { AttributionView } from '../AttributionView';
import { IpcRenderer } from 'electron';

let originalIpcRenderer: IpcRenderer;

describe('The Attribution View', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

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
    licenseText: 'Some license text',
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
  };
  testResourcesToManualAttributions['test other resource'] = [
    testOtherManualUuid,
  ];

  test('renders', () => {
    const { store } = renderComponentWithStore(<AttributionView />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { ['test resource']: 1 },
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );

    store.dispatch(navigateToView(View.Attribution));
    expect(screen.getByText('All Attributions (2)'));
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByText('Test other package, 2.0'));

    fireEvent.click(screen.getByText('Test package, 1.0') as Element);
    expect(screen.getByDisplayValue('Test package'));
    expect(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('test resource'));
  });

  test('filters Follow-ups', () => {
    const { store } = renderComponentWithStore(<AttributionView />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { ['test resource']: 1 },
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    store.dispatch(navigateToView(View.Attribution));
    expect(screen.getByText('All Attributions (2)'));
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByText('Test other package, 2.0'));

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFollowUp);

    expect(screen.getByText('Test other package, 2.0'));
    expect(screen.queryByText('Test package, 1.0')).not.toBeInTheDocument();
  });

  test('filters Only First Party', () => {
    const { store } = renderComponentWithStore(<AttributionView />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { ['test resource']: 1 },
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    store.dispatch(navigateToView(View.Attribution));
    expect(screen.getByText('All Attributions (2)'));
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByText('Test other package, 2.0'));

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFirstParty);

    expect(screen.getByText('Test package, 1.0'));
    expect(
      screen.queryByText('Test other package, 2.0')
    ).not.toBeInTheDocument();
  });

  test('filters Only First Party and follow ups and then hide first party and follow ups', () => {
    const { store } = renderComponentWithStore(<AttributionView />);
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { ['test resource']: 1 },
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    store.dispatch(navigateToView(View.Attribution));
    expect(screen.getByText('All Attributions (2)'));
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByText('Test other package, 2.0'));

    openDropDown(screen);
    clickOnFilter(screen, FilterType.OnlyFirstParty);
    clickOnFilter(screen, FilterType.OnlyFollowUp);

    expect(screen.queryByText('Test package, 1.0')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Test other package, 2.0')
    ).not.toBeInTheDocument();

    clickOnFilter(screen, FilterType.HideFirstParty);
    expect(screen.getByText('Test other package, 2.0'));
    expect(screen.queryByText('Test package, 1.0')).not.toBeInTheDocument();
  });
});
