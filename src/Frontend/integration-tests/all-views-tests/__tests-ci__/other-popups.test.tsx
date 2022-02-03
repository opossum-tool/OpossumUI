// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  getOpenResourcesButtonForPackagePanel,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../../test-helpers/general-test-helpers';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  PackageInfo,
  ParsedFileContent,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { fireEvent, screen } from '@testing-library/react';
import { ButtonText, DiscreteConfidence } from '../../../enums/enums';
import { IpcRenderer } from 'electron';
import { TIME_POPUP_IS_DISPLAYED } from '../../../Components/ErrorPopup/ErrorPopup';
import React from 'react';
import {
  expectButtonInHamburgerMenu,
  expectValueInTextBox,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import { clickOnElementInResourceBrowser } from '../../../test-helpers/resource-browser-test-helpers';
import {
  clickOnPathInPopupWithResources,
  expectErrorPopupIsNotShown,
  expectErrorPopupIsShown,
  expectUnsavedChangesPopupIsNotShown,
  expectUnsavedChangesPopupIsShown,
} from '../../../test-helpers/popup-test-helpers';
import {
  clickOnCardInAttributionList,
  clickOnTab,
  expectPackageInPackagePanel,
  expectPackagePanelShown,
  expectValueInAddToAttributionList,
} from '../../../test-helpers/package-panel-helpers';
import { setExternalAttributionSources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { ATTRIBUTION_SOURCES } from '../../../../shared/shared-constants';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

function mockSaveFileRequestChannel(): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementationOnce(
      mockElectronIpcRendererOn(IpcChannel.SaveFileRequest, true)
    );
}

describe('Other popups of the app', () => {
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

  test('warning popup appears and cancel button works', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
        attributions: {
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
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
          '/secondResource.js': ['uuid_2'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);
    insertValueIntoTextBox(screen, 'Name', 'new Name');
    expectValueInTextBox(screen, 'Name', 'new Name');

    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectUnsavedChangesPopupIsNotShown(screen);
    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Cancel);
    expectUnsavedChangesPopupIsNotShown(screen);
    expectValueInTextBox(screen, 'Name', 'new Name');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    clickOnButton(screen, ButtonText.Save);

    insertValueIntoTextBox(screen, 'Name', 'another new Name');
    expectValueInTextBox(screen, 'Name', 'another new Name');

    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectUnsavedChangesPopupIsNotShown(screen);
    clickOnTab(screen, 'All Attributions Tab');
    expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
    clickOnCardInAttributionList(screen, 'Vue, 1.2.0');
    expectUnsavedChangesPopupIsShown(screen);
  });

  test('warning popup appears and save button works', () => {
    const testInitialPackageName = 'InitialPackageName';
    const testPackageName = 'React - changed';
    const expectedNewAttribution: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageName: testPackageName,
    };
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: testInitialPackageName,
          },
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
        },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', testInitialPackageName);
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'Name', testPackageName);
    expectValueInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectUnsavedChangesPopupIsNotShown(screen);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.Save);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: expectedNewAttribution,
      },
      resourcesToAttributions: {
        '/firstResource.js': ['uuid_1'],
      },
      resolvedExternalAttributions: new Set(),
    };

    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
    expectUnsavedChangesPopupIsNotShown(screen);
    expectValueNotInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, true);
  });

  test('warning popup appears and save for all button works', () => {
    const testInitialPackageName = 'InitialPackageName';
    const testPackageName = 'React - changed';
    const expectedNewAttribution: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageName: testPackageName,
    };
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: testInitialPackageName,
          },
        },
        resourcesToAttributions: {
          '/firstResource.js': ['uuid_1'],
          '/secondResource.js': ['uuid_1'],
        },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');
    expectValueInTextBox(screen, 'Name', testInitialPackageName);
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'Name', testPackageName);
    expectValueInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    expectUnsavedChangesPopupIsNotShown(screen);

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    expectUnsavedChangesPopupIsShown(screen);

    clickOnButton(screen, ButtonText.SaveGlobally);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: expectedNewAttribution,
      },
      resourcesToAttributions: {
        '/firstResource.js': ['uuid_1'],
        '/secondResource.js': ['uuid_1'],
      },
      resolvedExternalAttributions: new Set(),
    };
    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
    expectUnsavedChangesPopupIsNotShown(screen);
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);
  });

  test('opens working popup with file list when clicking on show resources icon', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_2: 1 } },
        file: 1,
        directory_manual: { subdirectory_manual: { file_manual: 1 } },
      },
      manualAttributions: {
        attributions: {
          uuid_1: { packageName: 'React' },
        },
        resourcesToAttributions: {
          '/directory_manual/subdirectory_manual/': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            source: {
              name: 'HC',
              documentConfidence: 99.0,
            },
            packageName: 'JQuery',
          },
        },
        resourcesToAttributions: {
          '/root/src/': ['uuid_1'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    const { store } = renderComponentWithStore(<App />);
    store.dispatch(setExternalAttributionSources(ATTRIBUTION_SOURCES));

    clickOnElementInResourceBrowser(screen, '/');

    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals in Folder Content');

    fireEvent.click(getOpenResourcesButtonForPackagePanel(screen, 'JQuery'));
    clickOnPathInPopupWithResources(screen, '/root/src/');
    expectPackageInPackagePanel(screen, 'JQuery', 'High Compute');
  });

  jest.useFakeTimers();
  test('error popup works correctly for invalid PURL entry', () => {
    const testInvalidPurl = 'invalidPurl';
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'InitialPackageName',
          },
        },
        resourcesToAttributions: { '/firstResource.js': ['uuid_1'] },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');

    mockSaveFileRequestChannel();
    insertValueIntoTextBox(screen, 'PURL', testInvalidPurl);

    // Trigger sending signal in IpcChannel without the clicking on save button
    clickOnElementInResourceBrowser(screen, 'firstResource.js');

    expectErrorPopupIsShown(screen);
    jest.advanceTimersByTime(TIME_POPUP_IS_DISPLAYED);
    expectErrorPopupIsNotShown(screen);
  });

  test('saving works correctly with valid PURL entry with no popup', () => {
    const testValidPurl =
      'pkg:testtype/testnamespace/testname@testversion?testqualifiers#testsubpath';
    const expectedNewAttribution: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageType: 'testtype',
      packageNamespace: 'testnamespace',
      packageName: 'testname',
      packageVersion: 'testversion',
      packagePURLAppendix: '?testqualifiers=#testsubpath',
    };
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'firstResource.js': 1, 'secondResource.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'InitialPackageName',
          },
        },
        resourcesToAttributions: { '/firstResource.js': ['uuid_1'] },
      },
    };

    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');

    mockSaveFileRequestChannel();
    insertValueIntoTextBox(screen, 'PURL', testValidPurl);

    // Trigger sending signal in IpcChannel without the clicking on save button
    clickOnElementInResourceBrowser(screen, 'firstResource.js');

    expectErrorPopupIsNotShown(screen);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: expectedNewAttribution,
      },
      resourcesToAttributions: {
        '/firstResource.js': ['uuid_1'],
      },
      resolvedExternalAttributions: new Set(),
    };

    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
  });
});
