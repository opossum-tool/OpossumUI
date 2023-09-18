// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  closeProjectStatisticsPopup,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  getOpenResourcesButtonForPackagePanel,
  mockElectronBackend,
  mockElectronIpcRendererOn,
} from '../../../test-helpers/general-test-helpers';
import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  DiscreteConfidence,
  PackageInfo,
  ParsedFileContent,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { act, fireEvent, screen } from '@testing-library/react';
import { ButtonText } from '../../../enums/enums';
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
  clickOnNodeInPopupWithResources,
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

function mockSaveFileRequestChannel(): void {
  window.electronAPI.on
    // @ts-ignore
    .mockImplementationOnce(
      mockElectronIpcRendererOn(AllowedFrontendChannels.SaveFileRequest, true),
    );
}

describe('Other popups of the app', () => {
  it('warning popup appears and cancel button works', () => {
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
    closeProjectStatisticsPopup(screen);

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
    clickOnTab(screen, 'Global Tab');
    expectValueInAddToAttributionList(screen, 'Vue, 1.2.0');
    clickOnCardInAttributionList(screen, 'Vue, 1.2.0');
    expectUnsavedChangesPopupIsShown(screen);
  });

  it('warning popup appears and save button works', () => {
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
    closeProjectStatisticsPopup(screen);

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

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs,
    );
    expectUnsavedChangesPopupIsNotShown(screen);
    expectValueNotInTextBox(screen, 'Name', testPackageName);
    expectButton(screen, ButtonText.Save, true);
  });

  it('warning popup appears and save for all button works', () => {
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
    closeProjectStatisticsPopup(screen);

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
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs,
    );
    expectUnsavedChangesPopupIsNotShown(screen);
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);
  });

  it('opens working popup with file list when clicking on show resources icon', () => {
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
      externalAttributionSources: { HC: { name: 'High Compute', priority: 1 } },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, '/');

    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals in Folder Content');

    fireEvent.click(getOpenResourcesButtonForPackagePanel(screen, 'JQuery'));
    clickOnNodeInPopupWithResources(screen, 'src');
    expectPackageInPackagePanel(screen, 'JQuery', 'High Compute');
  });

  jest.useFakeTimers();
  it('error popup works correctly for invalid PURL entry', () => {
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
    closeProjectStatisticsPopup(screen);

    clickOnElementInResourceBrowser(screen, 'firstResource.js');

    mockSaveFileRequestChannel();
    insertValueIntoTextBox(screen, 'PURL', testInvalidPurl);

    // Trigger sending external attribution in IpcChannel without the clicking on save button
    clickOnElementInResourceBrowser(screen, 'firstResource.js');

    expectErrorPopupIsShown(screen);
    act(() => {
      jest.advanceTimersByTime(TIME_POPUP_IS_DISPLAYED);
    });
    expectErrorPopupIsNotShown(screen);
  });

  it('saving works correctly with valid PURL entry with no popup', () => {
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

    // Trigger sending external attribution in IpcChannel without the clicking on save button
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

    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs,
    );
  });
});
