// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  clickOnButton,
  clickOnProgressBar,
  EMPTY_PARSED_FILE_CONTENT,
  getOpenFileIcon,
  getParsedInputFileEnrichedWithTestData,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../../test-helpers/general-test-helpers';
import { App } from '../../../Components/App/App';
import { screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../../shared/ipc-channels';
import {
  Attributions,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  ButtonText,
  DiscreteConfidence,
  PackagePanelTitle,
} from '../../../enums/enums';
import {
  clickAddIconOnCardInAttributionList,
  clickOnPackageInPackagePanel,
  clickOnValueInManualPackagePanelForParentAttribution,
  expectAddIconInAddToAttributionCardIsHidden,
  expectAddIconInAddToAttributionCardIsNotHidden,
  expectPackageInPackagePanel,
  expectPackageNotInPackagePanel,
  expectPackagePanelNotShown,
  expectPackagePanelShown,
  expectValueInManualPackagePanel,
  expectValueInManualPackagePanelForParentAttribution,
  expectValueNotInManualPackagePanel,
} from '../../../test-helpers/package-panel-helpers';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenuIsNotShown,
  expectValueInConfidenceField,
  expectValueInTextBox,
  expectValueNotInConfidenceField,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
  getElementInResourceBrowser,
} from '../../../test-helpers/resource-browser-test-helpers';
import {
  expectReplaceAttributionPopupIsNotShown,
  expectReplaceAttributionPopupIsShown,
} from '../../../test-helpers/popup-test-helpers';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

function mockElectronBackend(mockChannelReturn: ParsedFileContent): void {
  window.ipcRenderer.on
    // @ts-ignore
    .mockImplementation(
      mockElectronIpcRendererOn(IpcChannel.FileLoaded, mockChannelReturn)
    );
}

describe('The App in Audit View', () => {
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

  test('renders TopBar and no ResourceBrowser when no resource file has been loaded', () => {
    renderComponentWithStore(<App />);

    expectResourceBrowserIsNotShown(screen);
    expect(getOpenFileIcon(screen));
  });

  test('allows to modify text in text boxes', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: { 'something.js': 1 },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
        },
        resourcesToAttributions: {
          '/something.js': ['uuid_1'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'something.js');
    insertValueIntoTextBox(screen, 'Name', 'Vue');
    expectValueInTextBox(screen, 'Name', 'Vue');

    insertValueIntoTextBox(screen, 'Version', '16.5.1');
    expectValueInTextBox(screen, 'Version', '16.5.1');

    insertValueIntoTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'new license'
    );
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'new license'
    );
  });

  test('shows aggregated and parent attributions correctly', () => {
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
    renderComponentWithStore(<App />);

    getElementInResourceBrowser(screen, 'root');
    expectPackagePanelNotShown(screen, 'Signals in Folder Content');
    expectPackagePanelNotShown(screen, 'Attributions in Folder Content');
    expectPackagePanelNotShown(screen, 'Signals');

    clickOnElementInResourceBrowser(screen, 'root');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals in Folder Content');

    clickOnElementInResourceBrowser(screen, 'src');
    expectPackagePanelShown(screen, 'Signals in Folder Content');
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals');

    clickOnElementInResourceBrowser(screen, 'directory_manual');
    expectPackageInPackagePanel(
      screen,
      'React',
      'Attributions in Folder Content'
    );
    clickOnElementInResourceBrowser(screen, 'subdirectory_manual');
    expectValueInManualPackagePanel(screen, 'React');

    clickOnElementInResourceBrowser(screen, 'file_manual');
    expectValueInTextBox(screen, 'Name', 'React');
    expectValueInManualPackagePanelForParentAttribution(screen, 'React');
    expectButtonInHamburgerMenuIsNotShown(screen, ButtonText.Delete);

    clickOnValueInManualPackagePanelForParentAttribution(screen, 'React');
    expectValueInTextBox(screen, 'Name', 'React');

    clickOnButton(screen, 'Override parent');
    expectValueNotInManualPackagePanel(screen, 'React');
    expectValueNotInTextBox(screen, 'Name', 'React');

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(screen, 'Name', 'Angular');
  });

  test('show confidence correctly', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        'withExternalAttribution.js': 1,
        'withoutAttribution.js': 1,
        'withManualAttribution.js': 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            attributionConfidence: DiscreteConfidence.High,
            packageName: 'Vue',
          },
        },
        resourcesToAttributions: {
          '/withManualAttribution.js': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_2: {
            attributionConfidence: 10,
            packageName: 'React',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
            comment: 'React comment',
          },
        },
        resourcesToAttributions: {
          '/withExternalAttribution.js': ['uuid_2'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'withExternalAttribution.js');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);

    clickOnPackageInPackagePanel(screen, 'React, 16.5.0', 'Signals');
    expect(screen.queryAllByDisplayValue('10').length).toEqual(1);
    expectValueNotInConfidenceField(
      screen,
      `High (${DiscreteConfidence.High})`
    );

    clickAddIconOnCardInAttributionList(screen, 'React, 16.5.0');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
    expectValueInTextBox(screen, 'Comment', 'React comment');
    expectValueInTextBox(screen, 'Name', 'React');
    clickOnButton(screen, ButtonText.Save);

    clickOnElementInResourceBrowser(screen, 'withManualAttribution.js');
    expectValueInTextBox(screen, 'Name', 'Vue');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);

    clickOnElementInResourceBrowser(screen, 'withoutAttribution.js');
    expectValueNotInConfidenceField(screen, '10');
    expectValueInConfidenceField(screen, `High (${DiscreteConfidence.High})`);
  });

  test('allows to switch between resources by clicking the progress bar', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { folder2: { file1: 1 } },
        file2: 1,
        folder3: { folder4: { file3: 1 } },
      },
      manualAttributions: {
        attributions: {},
        resourcesToAttributions: {},
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
            packageName: 'React',
          },
          uuid_3: {
            source: {
              name: 'HHC',
              documentConfidence: 80.0,
            },
            packageName: 'Vue',
          },
        },
        resourcesToAttributions: {
          '/folder1/folder2/file1': ['uuid_1'],
          '/file2': ['uuid_2'],
          '/folder3/folder4/file3': ['uuid_3'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);

    renderComponentWithStore(<App />);

    clickOnProgressBar(screen);
    expectPackageInPackagePanel(screen, 'JQuery', 'Signals');
    clickAddIconOnCardInAttributionList(screen, 'JQuery');

    clickOnElementInResourceBrowser(screen, 'folder3');
    clickOnElementInResourceBrowser(screen, 'folder4');
    clickOnElementInResourceBrowser(screen, 'file3');

    expectPackageInPackagePanel(screen, 'Vue', 'Signals');
    clickAddIconOnCardInAttributionList(screen, 'Vue');

    clickOnProgressBar(screen);
    expectPackageInPackagePanel(screen, 'React', 'Signals');
    clickAddIconOnCardInAttributionList(screen, 'React');

    clickOnProgressBar(screen);
    expectPackageInPackagePanel(screen, 'React', 'Signals');
  });

  test('resolve button is shown and works', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        folder1: { 'firstResource.js': 1 },
        'secondResource.js': 1,
        'thirdResource.js': 1,
      },

      externalAttributions: {
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
          uuid_3: {
            packageName: 'JQuery',
            packageVersion: '16.5.0',
            licenseText: 'Permission is hereby granted',
          },
        },
        resourcesToAttributions: {
          '/folder1/firstResource.js': ['uuid_1', 'uuid_3'],
          '/secondResource.js': ['uuid_2'],
          '/thirdResource.js': ['uuid_1', 'uuid_2'],
        },
      },

      resolvedExternalAttributions: new Set<string>().add('uuid_1'),
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'folder1');
    expectPackageInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages
    );
    expectPackageNotInPackagePanel(
      screen,
      'React, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages
    );

    clickOnPackageInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages
    );
    clickOnButton(screen, 'resolve attribution');
    expectPackageNotInPackagePanel(
      screen,
      'JQuery, 16.5.0',
      PackagePanelTitle.ContainedExternalPackages
    );

    clickOnElementInResourceBrowser(screen, 'thirdResource.js');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');

    clickOnPackageInPackagePanel(
      screen,
      'Vue, 1.2.0',
      PackagePanelTitle.ExternalPackages
    );
    clickOnButton(screen, 'resolve attribution');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'React, 16.5.0');
    expectAddIconInAddToAttributionCardIsHidden(screen, 'Vue, 1.2.0');

    clickOnElementInResourceBrowser(screen, 'secondResource.js');
    clickOnPackageInPackagePanel(
      screen,
      'Vue, 1.2.0',
      PackagePanelTitle.ExternalPackages
    );
    expectAddIconInAddToAttributionCardIsHidden(screen, 'Vue, 1.2.0');

    clickOnButton(screen, 'resolve attribution');
    expectAddIconInAddToAttributionCardIsNotHidden(screen, 'Vue, 1.2.0');
  });

  test('replaces attributions', () => {
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_2: {
          comment: 'ManualPackage',
          packageName: 'React',
          packageVersion: '16.0.0',
          attributionConfidence: DiscreteConfidence.High,
        },
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        '/root/src/file_1': ['uuid_2'],
        '/root/src/file_2': ['uuid_2'],
      },
    };
    const testResources: Resources = {
      root: { src: { file_1: 1, file_2: 1 } },
      file: 1,
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        attributionConfidence: DiscreteConfidence.Low,
      },
      uuid_2: {
        packageName: 'React',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        attributionConfidence: DiscreteConfidence.High,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/file_1': ['uuid_1'],
      '/root/src/file_2': ['uuid_2'],
    };

    mockElectronBackend(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      })
    );
    renderComponentWithStore(<App />);

    clickOnElementInResourceBrowser(screen, 'root');
    clickOnElementInResourceBrowser(screen, 'src');
    clickOnElementInResourceBrowser(screen, 'file_1');
    expectValueInTextBox(screen, 'Name', 'jQuery');

    expectButtonInHamburgerMenuIsNotShown(
      screen,
      ButtonText.UnmarkForReplacement
    );
    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkForReplacement);
    expectButtonInHamburgerMenuIsNotShown(
      screen,
      ButtonText.MarkForReplacement
    );
    clickOnButtonInHamburgerMenu(screen, ButtonText.UnmarkForReplacement);
    expectButtonInHamburgerMenuIsNotShown(
      screen,
      ButtonText.UnmarkForReplacement
    );
    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkForReplacement);

    clickOnElementInResourceBrowser(screen, 'file_2');
    expectValueInTextBox(screen, 'Name', 'React');

    clickOnButtonInHamburgerMenu(screen, ButtonText.ReplaceMarked);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Cancel);
    expectReplaceAttributionPopupIsNotShown(screen);

    clickOnElementInResourceBrowser(screen, 'file_1');
    expectValueInTextBox(screen, 'Name', 'jQuery');

    clickOnElementInResourceBrowser(screen, 'file_2');
    clickOnButtonInHamburgerMenu(screen, ButtonText.ReplaceMarked);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Replace);
    expectValueInTextBox(screen, 'Name', 'React');
    expectReplaceAttributionPopupIsNotShown(screen);

    clickOnElementInResourceBrowser(screen, 'file_1');
    expect(screen.queryByText('jQuery, 16.0.0')).not.toBeInTheDocument();
    expectValueInTextBox(screen, 'Name', 'React');

    // make sure resources are now linked to React attribution
    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
  });
});
