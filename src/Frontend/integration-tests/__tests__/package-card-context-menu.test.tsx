// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen, Screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { ButtonText } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickOnElementInResourceBrowser,
  expectButtonInPackageCardContextMenu,
  expectButtonInPackageCardContextMenuIsNotShown,
  expectContextMenuIsNotShown,
  getParsedInputFileEnrichedWithTestData,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../test-helpers/test-helpers';
import { App } from '../../Components/App/App';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

describe('The ContextMenu in Audit View', () => {
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

  const testResources: Resources = {
    folder1: { 'firstResource.js': 1 },
    'secondResource.js': 1,
    'thirdResource.js': 1,
  };

  const testResourcesToExternalAttributions: ResourcesToAttributions = {
    '/folder1/': ['uuid_ext_1'],
  };

  const testExternalAttributions: Attributions = {
    uuid_ext_1: {
      packageName: 'Jquery',
      packageVersion: '16.5.0',
      licenseText: 'Permission is hereby granted',
    },
  };

  const testManualAttributions: Attributions = {
    uuid_1: {
      packageName: 'React',
      packageVersion: '16.5.0',
      licenseText: 'Permission is hereby granted',
    },
    uuid_2: {
      packageName: 'Vue',
      packageVersion: '1.2.0',
      licenseText: 'Permission is not granted',
    },
  };

  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/folder1/': ['uuid_1'],
    '/secondResource.js': ['uuid_2'],
    '/thirdResource.js': ['uuid_1'],
  };

  test('is shown correctly for external Attributions', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');

    const cardLabel = 'Jquery, 16.5.0';
    expectButtonInPackageCardContextMenu(
      screen,
      cardLabel,
      ButtonText.ShowResources
    );

    expectButtonInPackageCardContextMenu(screen, cardLabel, ButtonText.Hide);

    expectButtonInPackageCardContextMenuIsNotShown(
      screen,
      cardLabel,
      ButtonText.Delete
    );

    expectButtonInPackageCardContextMenuIsNotShown(
      screen,
      cardLabel,
      ButtonText.DeleteGlobally
    );

    expectButtonInPackageCardContextMenuIsNotShown(
      screen,
      cardLabel,
      ButtonText.Confirm
    );

    expectButtonInPackageCardContextMenuIsNotShown(
      screen,
      cardLabel,
      ButtonText.ConfirmGlobally
    );
  });

  test('is shown correctly for preselected manual Attributions', () => {
    const testManualAttributionsPreselected: Attributions = {
      ...testManualAttributions,
      uuid_1: {
        ...testManualAttributions.uuid_1,
        preSelected: true,
      },
      uuid_2: {
        ...testManualAttributions.uuid_2,
        preSelected: true,
      },
    };

    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributionsPreselected,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');

    const cardLabelMultipleResources = 'React, 16.5.0';
    expectManualAttributionsButtons(
      screen,
      cardLabelMultipleResources,
      true,
      true
    );

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    const cardLabelSingleResource = 'Vue, 1.2.0';

    expectManualAttributionsButtons(
      screen,
      cardLabelSingleResource,
      true,
      false
    );
  });

  test('is shown correctly for not preselected manual Attributions', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');

    const cardLabelMultipleResources = 'React, 16.5.0';

    expectManualAttributionsButtons(
      screen,
      cardLabelMultipleResources,
      false,
      true
    );

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    const cardLabelSingleResource = 'Vue, 1.2.0';

    expectManualAttributionsButtons(
      screen,
      cardLabelSingleResource,
      false,
      false
    );
  });

  test('is not shown for Add new attribution', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');

    const cardLabel = 'Add new attribution';
    expectContextMenuIsNotShown(screen, cardLabel);
  });

  function expectManualAttributionsButtons(
    screen: Screen,
    cardLabel: string,
    preselected: boolean,
    multipleResources: boolean
  ): void {
    expectButtonInPackageCardContextMenu(
      screen,
      cardLabel,
      ButtonText.ShowResources
    );

    expectButtonInPackageCardContextMenuIsNotShown(
      screen,
      cardLabel,
      ButtonText.Hide
    );

    expectButtonInPackageCardContextMenu(screen, cardLabel, ButtonText.Delete);

    if (multipleResources) {
      expectButtonInPackageCardContextMenu(
        screen,
        cardLabel,
        ButtonText.DeleteGlobally
      );

      if (preselected) {
        expectButtonInPackageCardContextMenu(
          screen,
          cardLabel,
          ButtonText.ConfirmGlobally
        );
      }
    } else {
      expectButtonInPackageCardContextMenuIsNotShown(
        screen,
        cardLabel,
        ButtonText.ConfirmGlobally
      );

      expectButtonInPackageCardContextMenuIsNotShown(
        screen,
        cardLabel,
        ButtonText.DeleteGlobally
      );
    }

    if (preselected) {
      expectButtonInPackageCardContextMenu(
        screen,
        cardLabel,
        ButtonText.Confirm
      );
    } else {
      expectButtonInPackageCardContextMenuIsNotShown(
        screen,
        cardLabel,
        ButtonText.Confirm
      );

      expectButtonInPackageCardContextMenuIsNotShown(
        screen,
        cardLabel,
        ButtonText.ConfirmGlobally
      );
    }
  }
});
