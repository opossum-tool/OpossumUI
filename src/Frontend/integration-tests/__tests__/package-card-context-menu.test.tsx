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
import { ButtonText, View } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickOnElementInResourceBrowser,
  clickOnTab,
  expectContextMenuIsNotShown,
  expectCorrectButtonsInContextMenu,
  getParsedInputFileEnrichedWithTestData,
  goToView,
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

const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/folder1/': ['uuid_1'],
  '/secondResource.js': ['uuid_2'],
  '/thirdResource.js': ['uuid_1'],
};

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

  test('is shown correctly for external Attributions in the signals tab', () => {
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
    expectCorrectButtonsInContextMenu(
      screen,
      cardLabel,
      [ButtonText.ShowResources, ButtonText.Hide],
      [
        ButtonText.Delete,
        ButtonText.DeleteGlobally,
        ButtonText.Confirm,
        ButtonText.ConfirmGlobally,
      ]
    );
  });

  describe('in the ManualPackagePanel', () => {
    test('is shown correctly for preselected manual Attributions', () => {
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
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelMultipleResources,
        [
          ButtonText.ShowResources,
          ButtonText.Delete,
          ButtonText.DeleteGlobally,
          ButtonText.Confirm,
          ButtonText.ConfirmGlobally,
        ],
        [ButtonText.Hide]
      );

      clickOnElementInResourceBrowser(screen, 'secondResource.js');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelSingleResource,
        [ButtonText.ShowResources, ButtonText.Delete, ButtonText.Confirm],
        [ButtonText.Hide, ButtonText.DeleteGlobally, ButtonText.ConfirmGlobally]
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
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelMultipleResources,
        [
          ButtonText.ShowResources,
          ButtonText.Delete,
          ButtonText.DeleteGlobally,
        ],
        [ButtonText.Hide, ButtonText.Confirm, ButtonText.ConfirmGlobally]
      );

      clickOnElementInResourceBrowser(screen, 'secondResource.js');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectButtonsInContextMenu(
        screen,
        cardLabelSingleResource,
        [ButtonText.ShowResources, ButtonText.Delete],
        [
          ButtonText.Hide,
          ButtonText.Confirm,
          ButtonText.ConfirmGlobally,
          ButtonText.DeleteGlobally,
        ]
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
  });

  describe('in the all attributions panel', () => {
    test('is shown correctly for preselected manual Attributions', () => {
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributionsPreselected,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);
      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelMultipleResources
      );

      clickOnElementInResourceBrowser(screen, 'folder1');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelSingleResource
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
      clickOnElementInResourceBrowser(screen, 'secondResource.js');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelMultipleResources = 'React, 16.5.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelMultipleResources
      );

      clickOnElementInResourceBrowser(screen, 'folder1');
      clickOnTab(screen, 'All Attributions Tab');

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelSingleResource
      );
    });
  });

  describe('in the attributions in folder content panel', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1, 'secondResource.js': 1 },
      'thirdResource.js': 1,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/firstResource.js': ['uuid_1'],
      '/folder1/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_1'],
    };

    test('is shown correctly for preselected manual Attributions', () => {
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
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelMultipleResources
      );

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsPreselectedAttribution(
        cardLabelSingleResource
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
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelMultipleResources
      );

      const cardLabelSingleResource = 'Vue, 1.2.0';
      expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
        cardLabelSingleResource
      );
    });
  });
});

describe('The ContextMenu in Attribution View', () => {
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

  test('is shown correctly for preselected manual Attributions', () => {
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributionsPreselected,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);
    goToView(screen, View.Attribution);

    const cardLabelMultipleResources = 'React, 16.5.0';
    expectCorrectGlobalOnlyButtonsPreselectedAttribution(
      cardLabelMultipleResources
    );

    const cardLabelSingleResource = 'Vue, 1.2.0';
    expectCorrectGlobalOnlyButtonsPreselectedAttribution(
      cardLabelSingleResource
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
    goToView(screen, View.Attribution);

    const cardLabelMultipleResources = 'React, 16.5.0';
    expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
      cardLabelMultipleResources
    );

    const cardLabelSingleResource = 'Vue, 1.2.0';
    expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
      cardLabelSingleResource
    );
  });
});

function expectCorrectGlobalOnlyButtonsNotPreselectedAttribution(
  cardLabel: string
): void {
  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    [ButtonText.ShowResources, ButtonText.DeleteGlobally],
    [
      ButtonText.Hide,
      ButtonText.Delete,
      ButtonText.Confirm,
      ButtonText.ConfirmGlobally,
    ]
  );
}

function expectCorrectGlobalOnlyButtonsPreselectedAttribution(
  cardLabel: string
): void {
  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    [
      ButtonText.ShowResources,
      ButtonText.DeleteGlobally,
      ButtonText.ConfirmGlobally,
    ],
    [ButtonText.Hide, ButtonText.Delete, ButtonText.Confirm]
  );
}
