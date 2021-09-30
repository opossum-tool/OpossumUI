// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import { ParsedFileContent } from '../../../shared/shared-types';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickAddNewAttributionButton,
  clickOnButton,
  clickOnEditIconForElement,
  clickOnElementInResourceBrowser,
  clickOnPackageInPackagePanel,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  expectButtonInContextMenu,
  expectUnsavedChangesPopupIsShown,
  expectValueInManualPackagePanel,
  expectValueInTextBox,
  expectValueNotInManualPackagePanel,
  expectValueNotInTextBox,
  goToView,
  insertValueIntoTextBox,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../test-helpers/test-helpers';
import { App } from '../../Components/App/App';

import { ButtonTitle, View } from '../../enums/enums';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

describe('The App integration', () => {
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

  test('save some attributions and navigate around', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'jQuery',
            packageVersion: '16.5.0',
            licenseText: 'Hey Permission is hereby not granted',
          },
          uuid_2: {
            packageName: 'Vue',
            packageVersion: '1.2.0',
            licenseText: 'Permission is not granted',
          },
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
          '/secondResource.js': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_3: {
            attributionConfidence: 10,
            packageName: 'jQuery',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
        },
        resourcesToAttributions: {
          '/secondResource.js': ['uuid_3'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectButton(screen, ButtonTitle.Save, true);
    expectButtonInContextMenu(screen, ButtonTitle.Undo, true);
    expectButton(screen, ButtonTitle.SaveForAll, true);

    insertValueIntoTextBox(screen, 'Name', 'Typescript');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectButton(screen, ButtonTitle.Save, false);
    expectButtonInContextMenu(screen, ButtonTitle.Undo, false);
    expectButton(screen, ButtonTitle.SaveForAll, false);

    clickOnButton(screen, ButtonTitle.SaveForAll);
    expectValueNotInTextBox(screen, 'Name', 'jQuery');
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectButton(screen, ButtonTitle.Save, true);
    expectButtonInContextMenu(screen, ButtonTitle.Undo, true);
    expectButton(screen, ButtonTitle.SaveForAll, true);

    // save another attribution
    clickAddNewAttributionButton(screen);

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Name', 'Angular');
    expectButton(screen, ButtonTitle.Save, false);
    expectButtonInContextMenu(screen, ButtonTitle.Undo, false);

    clickOnButton(screen, ButtonTitle.Save);

    expectValueInManualPackagePanel(screen, 'Angular');
    expectValueInManualPackagePanel(screen, 'Typescript, 16.5.0');

    //delete again
    expectValueInTextBox(screen, 'Name', 'Angular');
    insertValueIntoTextBox(screen, 'Name', '');
    expectValueNotInTextBox(screen, 'Name', 'Angular');

    clickOnButton(screen, ButtonTitle.Save);

    expectValueNotInManualPackagePanel(screen, 'Angular');
    expectValueInManualPackagePanel(screen, 'Typescript, 16.5.0');

    //go to report view, then attribution view and modify attribution
    goToView(screen, View.Report);
    clickOnEditIconForElement(screen, 'Typescript');
    expectValueInTextBox(screen, 'Name', 'Typescript');
    expectValueInTextBox(screen, 'Version', '16.5.0');
    insertValueIntoTextBox(screen, 'Version', '1');

    goToView(screen, View.Audit);
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonTitle.Save);
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueNotInManualPackagePanel(screen, 'Angular');
    expectValueInManualPackagePanel(screen, 'Typescript, 1');

    clickOnPackageInPackagePanel(screen, 'jQuery, 16.5.0', 'Signals');
    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(screen, 'Version', '16.5.0');

    //go to another resource
    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'Hey Permission is hereby not granted'
    );
    expectValueInTextBox(screen, 'Version', '1');
    insertValueIntoTextBox(screen, 'Version', '1000');

    //try going to the other resource
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectUnsavedChangesPopupIsShown(screen);
    clickOnButton(screen, ButtonTitle.Cancel);

    expectValueInTextBox(screen, 'Version', '1000');
    clickOnButton(screen, ButtonTitle.Save);

    //actually go
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectValueInManualPackagePanel(screen, 'Typescript, 1');
  });

  test('app shows empty AttributionsDetailsViewer for selected Signals', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { folder2: { file1: 1 } },
        file2: 1,
      },

      externalAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 50.0,
            },
            packageName: 'JQuery',
          },
          uuid_2: {
            source: {
              name: 'SC',
              documentConfidence: 9.0,
            },
            packageName: 'Angular',
          },
        },
        resourcesToAttributions: {
          '/folder1/folder2/file1': ['uuid_1'],
          '/file2': ['uuid_2'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);

    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'file2');
    clickOnPackageInPackagePanel(screen, 'Angular', 'Signals');
    expectValueInTextBox(screen, 'Name', 'Angular');

    goToView(screen, View.Attribution);

    expect(screen.queryByText('Linked Resources')).toBeFalsy();
  });

  test('recognizes frequent licenses and shows full license text in report view', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'something.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: '',
          },
        },
        resourcesToAttributions: {
          '/something.js': ['uuid_1'],
        },
      },
      frequentLicenses: {
        nameOrder: ['GPL-2.0', 'Apache'],
        texts: {
          'GPL-2.0': 'frequent license',
          Apache: 'Apache license',
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'something.js');

    insertValueIntoTextBox(screen, 'License Name', 'gpl-2.0');
    clickOnButton(screen, ButtonTitle.Save);

    goToView(screen, View.Report);
    screen.getByText('gpl-2.0');
    expect(screen.queryByText('frequent license')).toBeFalsy();

    goToView(screen, View.Audit);
    insertValueIntoTextBox(screen, 'License Name', 'GPL-2.0');

    clickOnButton(screen, ButtonTitle.Save);
    goToView(screen, View.Report);
    screen.getByText('GPL-2.0');
    screen.getByText('frequent license');

    goToView(screen, View.Audit);
    insertValueIntoTextBox(screen, 'License Name', 'Apac');
    fireEvent.click(screen.getByText('Apache'));
    clickOnButton(screen, ButtonTitle.Save);
    goToView(screen, View.Report);
    screen.getByText('Apache');
    screen.getByText('Apache license');
  });
});
