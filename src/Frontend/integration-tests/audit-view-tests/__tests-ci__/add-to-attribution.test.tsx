// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  clickOnButton,
  getParsedInputFileEnrichedWithTestData,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../../test-helpers/general-test-helpers';
import { App } from '../../../Components/App/App';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { fireEvent, screen } from '@testing-library/react';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ButtonText, DiscreteConfidence } from '../../../enums/enums';
import { IpcRenderer } from 'electron';
import React from 'react';
import {
  clickAddIconOnCardInAttributionList,
  clickOnTab,
  expectPackageInPackagePanel,
  expectValueInAddToAttributionList,
  expectValueNotInAddToAttributionList,
  getCardInAttributionList,
} from '../../../test-helpers/package-panel-helpers';
import {
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

describe('Add to attribution', () => {
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

  test(
    'AddToAttribution shows attribution correctly, ' +
      'does not show parent attribution, and adds attribution',
    () => {
      const testResources: Resources = {
        folder1: { 'firstResource.js': 1 },
        'secondResource.js': 1,
        'thirdResource.js': 1,
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
          attributionConfidence: DiscreteConfidence.Low,
        },
        uuid_3: {
          packageName: 'Angular',
          packageVersion: '10',
          licenseText: 'Permission is maybe granted.',
          attributionConfidence: DiscreteConfidence.High,
          comment: 'Comment for Angular',
        },
      };
      const testResourcesToManualAttributions: ResourcesToAttributions = {
        '/folder1/': ['uuid_1'],
        '/secondResource.js': ['uuid_2'],
        '/thirdResource.js': ['uuid_3'],
      };
      mockElectronBackend(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      );

      renderComponentWithStore(<App />);

      clickOnElementInResourceBrowser(screen, 'folder1');
      clickOnElementInResourceBrowser(screen, 'firstResource.js');
      clickOnButton(screen, 'Override parent');
      clickOnTab(screen, 'All Attributions Tab');
      expectValueInAddToAttributionList(screen, 'React, 16.5.0');
      expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
      expectValueInAddToAttributionList(screen, 'Angular, 10');
      expectValueNotInTextBox(
        screen,
        'Confidence',
        `Low (${DiscreteConfidence.Low})`
      );

      fireEvent.click(getCardInAttributionList(screen, 'Vue, 1.2.0'));
      expectValueInAddToAttributionList(screen, 'React, 16.5.0');
      expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
      expectValueInAddToAttributionList(screen, 'Angular, 10');
      expectValueInTextBox(
        screen,
        'License Text (to appear in attribution document)',
        'Permission is not granted'
      );
      expectValueInTextBox(screen, 'Name', 'Vue');
      expectValueInConfidenceField(screen, `Low (${DiscreteConfidence.Low})`);
      clickAddIconOnCardInAttributionList(screen, 'Angular, 10');

      expectValueInAddToAttributionList(screen, 'React, 16.5.0');
      expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
      expectValueInTextBox(screen, 'Comment', 'Comment for Angular');
      expectValueInTextBox(
        screen,
        'License Text (to appear in attribution document)',
        'Permission is maybe granted.'
      );
      expectValueInTextBox(screen, 'Name', 'Angular');
      expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    }
  );

  test('AddToAttribution removes abandoned attributions', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
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
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '10',
        licenseText: 'Permission is maybe granted.',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_3'],
    };
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'All Attributions Tab');
    expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');

    clickAddIconOnCardInAttributionList(screen, 'Vue, 1.2.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'Permission is not granted'
    );
    expectValueInTextBox(screen, 'Name', 'Vue');

    expectValueInAddToAttributionList(screen, 'Angular, 10');

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    clickOnTab(screen, 'All Attributions Tab');
    expectValueInAddToAttributionList(screen, 'React, 16.5.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');
  });

  test('AddToAttribution and deletion updates attributed children', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
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
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '10',
        licenseText: 'Permission is maybe granted.',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_3'],
    };
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'All Attributions Tab');
    expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
    expectValueInAddToAttributionList(screen, 'Angular, 10');

    clickAddIconOnCardInAttributionList(screen, 'Vue, 1.2.0');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'Permission is not granted'
    );
    expectValueInTextBox(screen, 'Name', 'Vue');

    insertValueIntoTextBox(screen, 'Name', '');
    insertValueIntoTextBox(screen, 'Version', '');
    insertValueIntoTextBox(
      screen,
      'License Text (to appear in attribution document)',
      ''
    );

    clickOnButton(screen, ButtonText.Save);

    clickOnElementInResourceBrowser(screen, '/');
    expectPackageInPackagePanel(
      screen,
      'Angular, 10',
      'Attributions in Folder Content'
    );
  });

  test('AddToAttribution not shown for breakpoints', () => {
    const testResources: Resources = {
      folder1: { 'firstResource.js': 1 },
      'secondResource.js': 1,
      'thirdResource.js': 1,
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
      uuid_3: {
        packageName: 'Angular',
        packageVersion: '10',
        licenseText: 'Permission is maybe granted.',
      },
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
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid_1'],
      '/secondResource.js': ['uuid_2'],
      '/thirdResource.js': ['uuid_3'],
    };
    const attributionBreakpoints = new Set<string>().add('/folder1/');
    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
        attributionBreakpoints,
      })
    );

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    clickOnTab(screen, 'All Attributions Tab');
    expectValueNotInAddToAttributionList(screen, 'Vue, 1.2.0');
    expectValueNotInAddToAttributionList(screen, 'Angular, 10');

    clickOnTab(screen, 'Signals & Content Tab');
    expectValueNotInAddToAttributionList(screen, 'Jquery, 16.5.0');
  });
});
