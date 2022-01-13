// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import { ConfirmMultiSelectDeletionPopup } from '../ConfirmMultiSelectDeletionPopup';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  clickOnButton,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
import { ButtonText } from '../../../enums/enums';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { IpcRenderer } from 'electron';

let originalIpcRenderer: IpcRenderer;

describe('The ConfirmMultiSelectDeletionPopup', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders', () => {
    const expectedContent =
      'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.';
    const expectedHeader = 'Confirm Deletion';

    const { store } = renderComponentWithStore(
      <ConfirmMultiSelectDeletionPopup />
    );
    store.dispatch(setMultiSelectSelectedAttributionIds(['uuid_1', 'uuid_2']));

    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });

  test('deletes attributions', () => {
    const expectedContent =
      'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.';
    const expectedHeader = 'Confirm Deletion';

    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
      },
      uuid2: {
        packageName: 'Vue',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
      '/somethingElse.js': ['uuid2'],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    testStore.dispatch(
      setMultiSelectSelectedAttributionIds(['uuid1', 'uuid2'])
    );

    const { store } = renderComponentWithStore(
      <ConfirmMultiSelectDeletionPopup />,
      { store: testStore }
    );

    store.dispatch(setMultiSelectSelectedAttributionIds(['uuid1', 'uuid2']));
    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    clickOnButton(screen, ButtonText.Confirm);
    expect(getManualAttributions(store.getState())).toEqual({});
  });
});
