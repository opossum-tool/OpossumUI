// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { App } from '../../../Components/App/App';
import {
  clickOnButton,
  clickOnOpenFileIcon,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  goToView,
  mockElectronIpcRendererOn,
  TEST_TIMEOUT,
} from '../../../test-helpers/general-test-helpers';
import { fireEvent, screen } from '@testing-library/react';
import { IpcChannel } from '../../../../shared/ipc-channels';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  PackageInfo,
  ParsedFileContent,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { ButtonText, DiscreteConfidence, View } from '../../../enums/enums';
import { IpcRenderer } from 'electron';
import React from 'react';
import { clickOnPackageInPackagePanel } from '../../../test-helpers/package-panel-helpers';
import {
  clickOnButtonInHamburgerMenu,
  expectButtonInHamburgerMenu,
  expectValueInTextBox,
  expectValueNotInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnElementInResourceBrowser,
  expectResourceBrowserIsNotShown,
} from '../../../test-helpers/resource-browser-test-helpers';
import {
  expectReplaceAttributionPopupIsNotShown,
  expectReplaceAttributionPopupIsShown,
  expectUnsavedChangesPopupIsShown,
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

describe('The App in attribution view', () => {
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

    expect(screen.queryByText('Linked Resources')).not.toBeInTheDocument();
  });

  test('allows to modify text in text boxes', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_1: 1, file_2: 1 } },
        file: 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'Angular',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
          },
          uuid_2: {
            packageName: 'Vue',
            packageVersion: '2.6.0',
            comment: 'ManualPackage 2',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_1': ['uuid_1'],
          '/root/src/file_2': ['uuid_2'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Angular, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Version', '16.0.0');
    expectValueInTextBox(screen, 'Comment', 'ManualPackage');
    expect(screen.queryByText('jQuery')).not.toBeInTheDocument();

    insertValueIntoTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(screen, 'Name', 'jQuery');

    fireEvent.click(screen.getByText('Vue, 2.6.0') as Element);
    expectUnsavedChangesPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Save);

    expectValueInTextBox(screen, 'Name', 'Vue');
    expectValueInTextBox(screen, 'Version', '2.6.0');
    expectValueInTextBox(screen, 'Comment', 'ManualPackage 2');
    expect(screen.queryByText('jQuery')).not.toBeInTheDocument();

    insertValueIntoTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(screen, 'Name', 'jQuery');
  });

  test('handles purls correctly', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_1: 1, file_2: 1 } },
        file: 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'Angular',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
          },
          uuid_2: {
            packageName: 'Vue',
            packageVersion: '2.6.0',
            comment: 'ManualPackage 2',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_1': ['uuid_1'],
          '/root/src/file_2': ['uuid_2'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('Angular, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'Angular');
    expectValueInTextBox(screen, 'Version', '16.0.0');
    expectValueInTextBox(screen, 'Comment', 'ManualPackage');

    insertValueIntoTextBox(
      screen,
      'PURL',
      'pkg:rpm/opensuse/curl@7.56.1-1.1.?arch=i386&distro=opensuse-tumbleweed'
    );
    expectValueInTextBox(
      screen,
      'PURL',
      'pkg:rpm/opensuse/curl@7.56.1-1.1.?arch=i386&distro=opensuse-tumbleweed'
    );
    expectValueInTextBox(screen, 'Name', 'curl');
    expectValueInTextBox(screen, 'Version', '7.56.1-1.1.');

    fireEvent.click(screen.getByText('Vue, 2.6.0') as Element);
    expectUnsavedChangesPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(screen, 'PURL', '');

    fireEvent.click(screen.getByText('curl, 7.56.1-1.1.') as Element);

    expectValueInTextBox(
      screen,
      'PURL',
      'pkg:rpm/opensuse/curl@7.56.1-1.1.?arch=i386&distro=opensuse-tumbleweed'
    );
    expectValueInTextBox(screen, 'Name', 'curl');
    expectValueInTextBox(screen, 'Version', '7.56.1-1.1.');

    insertValueIntoTextBox(screen, 'PURL', 'invalid-purl');
    expectValueInTextBox(screen, 'Name', 'curl');
    expectValueInTextBox(screen, 'Version', '7.56.1-1.1.');
    expectButton(screen, ButtonText.Save, true);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, true);

    insertValueIntoTextBox(screen, 'PURL', 'pkg:test/name@version');
    expectValueInTextBox(screen, 'Name', 'name');
    expectValueInTextBox(screen, 'Version', 'version');
    expectButton(screen, ButtonText.Save, false);
    expectButtonInHamburgerMenu(screen, ButtonText.Undo, false);
    clickOnButton(screen, ButtonText.Save);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: {
          attributionConfidence: DiscreteConfidence.High,
          comment: 'ManualPackage',
          packageName: 'curl',
          packageNamespace: 'opensuse',
          packagePURLAppendix: '?arch=i386&distro=opensuse-tumbleweed',
          packageType: 'rpm',
          packageVersion: '7.56.1-1.1.',
        },
        uuid_2: {
          comment: 'ManualPackage 2',
          packageName: 'Vue',
          packageVersion: '2.6.0',
        },
      },
      resolvedExternalAttributions: new Set(),
      resourcesToAttributions: {
        '/root/src/file_1': ['uuid_1'],
        '/root/src/file_2': ['uuid_2'],
      },
    };
    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['OpenFile']],
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
      [IpcChannel['SaveFile'], expect.anything()],
    ]);
  });

  test('saves an updated attribution to file', () => {
    const testManualPackage: PackageInfo = {
      packageName: 'jQuery',
      packageVersion: '16.0.0',
      comment: 'ManualPackage',
    };
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: {
          ...testManualPackage,
          attributionConfidence: DiscreteConfidence.High,
          packageName: 'Angular',
        },
      },
      resourcesToAttributions: {
        '/root/src/file_1': ['uuid_1'],
      },
      resolvedExternalAttributions: new Set<string>().add('test_id'),
    };

    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      metadata: {
        projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
        fileCreationDate: '2020-07-23 11:47:13.764544',
      },
      resources: {
        root: { src: { file_1: 1, file_2: 1 } },
        file: 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'jQuery',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_1': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'Vue',
            packageVersion: '2.6.0',
            comment: 'ExternalPackage',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_2': ['uuid_1'],
        },
      },

      resolvedExternalAttributions: new Set<string>().add('test_id'),
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('jQuery, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(screen, 'Version', '16.0.0');
    expectValueInTextBox(screen, 'Comment', 'ManualPackage');

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    clickOnButtonInHamburgerMenu(screen, ButtonText.Undo);

    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueNotInTextBox(screen, 'Name', 'Angular');

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    clickOnButton(screen, ButtonText.Save);

    expectValueInTextBox(screen, 'Name', 'Angular');
    expectValueNotInTextBox(screen, 'Name', 'jQuery');
    expect(screen.getByText('Angular, 16.0.0'));

    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['OpenFile']],
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
  });

  test('deletes an attribution', () => {
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {},
      resourcesToAttributions: {},
      resolvedExternalAttributions: new Set(),
    };

    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_1: 1, file_2: 1 } },
        file: 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'jQuery',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_1': ['uuid_1'],
        },
      },
      externalAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'Vue',
            packageVersion: '2.6.0',
            comment: 'ExternalPackage',
          },
        },
        resourcesToAttributions: {
          '/root/src/file_2': ['uuid_1'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('jQuery, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(screen, 'Version', '16.0.0');
    expectValueInTextBox(screen, 'Comment', 'ManualPackage');

    insertValueIntoTextBox(screen, 'Name', '');
    insertValueIntoTextBox(screen, 'Version', '');
    insertValueIntoTextBox(screen, 'Comment', '');
    clickOnButton(screen, ButtonText.Save);

    expect(screen.queryByText('jQuery, 16.0.0')).not.toBeInTheDocument();
    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['OpenFile']],
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
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
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        root: { src: { file_1: 1, file_2: 1 } },
        file: 1,
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            packageName: 'jQuery',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
            attributionConfidence: DiscreteConfidence.High,
          },
          uuid_2: {
            packageName: 'React',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
            attributionConfidence: DiscreteConfidence.High,
          },
        },
        resourcesToAttributions: {
          '/root/src/file_1': ['uuid_1'],
          '/root/src/file_2': ['uuid_2'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Attribution);
    expectResourceBrowserIsNotShown(screen);

    fireEvent.click(screen.getByText('jQuery, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'jQuery');
    screen.getByText('/root/src/file_1');

    clickOnButtonInHamburgerMenu(screen, ButtonText.MarkForReplacement);

    fireEvent.click(screen.getByText('React, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'React');
    screen.getByText('/root/src/file_2');

    clickOnButtonInHamburgerMenu(screen, ButtonText.ReplaceMarked);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Cancel);
    expect(screen.getByText('jQuery, 16.0.0')).toBeInTheDocument();
    expectReplaceAttributionPopupIsNotShown(screen);

    clickOnButtonInHamburgerMenu(screen, ButtonText.ReplaceMarked);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonText.Replace);
    expectValueInTextBox(screen, 'Name', 'React');
    expectReplaceAttributionPopupIsNotShown(screen);
    expect(screen.queryByText('jQuery, 16.0.0')).not.toBeInTheDocument();
    screen.getByText('/root/src/file_1');
    screen.getByText('/root/src/file_2');

    // make sure resources are now linked to React attribution
    // @ts-ignore
    expect(window.ipcRenderer.invoke.mock.calls).toEqual([
      [IpcChannel['OpenFile']],
      [IpcChannel['SaveFile'], expectedSaveFileArgs],
    ]);
  });
});
