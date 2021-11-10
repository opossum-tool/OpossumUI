// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { ButtonText, DiscreteConfidence, View } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickOnCardInAttributionList,
  clickOnElementInResourceBrowser,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
  getParsedInputFileEnrichedWithTestData,
  goToView,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../test-helpers/test-helpers';
import { App } from '../../Components/App/App';
import {
  clickOnButtonInPackageContextMenu,
  expectContextMenuForNotPreSelectedAttributionMultipleResources,
  expectGlobalOnlyContextMenuForNotPreselectedAttribution,
  expectGlobalOnlyContextMenuForPreselectedAttribution,
  expectNoConfirmationButtonsShown,
} from '../../test-helpers/context-menu-test-helpers';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

const testResources: Resources = {
  'firstResource.js': 1,
  'secondResource.js': 1,
  'thirdResource.js': 1,
  'fourthResource.js': 1,
};

const testManualAttributions: Attributions = {
  uuid_1: {
    packageName: 'React',
    packageVersion: '16.5.0',
    licenseText: 'Permission is hereby granteds',
    comment: 'Attribution of multiple resources',
    attributionConfidence: 10,
    preSelected: true,
  },
  uuid_2: {
    packageName: 'Vue',
    packageVersion: '1.2.0',
    licenseText: 'Permission is not granted',
    comment: 'Attribution of one resources',
    attributionConfidence: 90,
    preSelected: true,
  },
};

const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/firstResource.js': ['uuid_1'],
  '/secondResource.js': ['uuid_1'],
  '/thirdResource.js': ['uuid_1'],
  '/fourthResource.js': ['uuid_2'],
};

describe('The ContextMenu', () => {
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

  describe('confirmation buttons', () => {
    test('work correctly in Attribution View', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );
      renderComponentWithStore(<App />);

      goToView(screen, View.Attribution);
      expectGlobalOnlyContextMenuForPreselectedAttribution(
        screen,
        'React, 16.5.0'
      );
      clickOnButtonInPackageContextMenu(
        screen,
        'React, 16.5.0',
        ButtonText.ConfirmGlobally
      );
      expectGlobalOnlyContextMenuForNotPreselectedAttribution(
        screen,
        'React, 16.5.0'
      );
      clickOnCardInAttributionList(screen, 'React, 16.5.0');
      expectValueInTextBox(screen, 'Name', 'React');
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
      expectNoConfirmationButtonsShown(screen, 'React, 16.5.0');

      goToView(screen, View.Audit);
      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      expectContextMenuForNotPreSelectedAttributionMultipleResources(
        screen,
        'React, 16.5.0'
      );
      expectValueInTextBox(screen, 'Name', 'React');
      expectValueNotInConfidenceField(screen, '10');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    });
  });
});
