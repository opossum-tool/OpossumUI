// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  PackageInfo,
  ParsedFileContent,
  SaveFileArgs,
} from '../../../shared/shared-types';
import { ButtonTitle, DiscreteConfidence, View } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickOnButton,
  clickOnButtonInContextMenu,
  clickOnOpenFileIcon,
  EMPTY_PARSED_FILE_CONTENT,
  expectButton,
  expectButtonInContextMenu,
  expectReplaceAttributionPopupIsNotShown,
  expectReplaceAttributionPopupIsShown,
  expectResourceBrowserIsNotShown,
  expectUnsavedChangesPopupIsShown,
  expectValueInTextBox,
  expectValueNotInTextBox,
  goToView,
  insertValueIntoTextBox,
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
    expect(screen.queryByText('jQuery')).toBeFalsy();

    insertValueIntoTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(screen, 'Name', 'jQuery');

    fireEvent.click(screen.getByText('Vue, 2.6.0') as Element);
    expectUnsavedChangesPopupIsShown(screen);
    clickOnButton(screen, ButtonTitle.Save);

    expectValueInTextBox(screen, 'Name', 'Vue');
    expectValueInTextBox(screen, 'Version', '2.6.0');
    expectValueInTextBox(screen, 'Comment', 'ManualPackage 2');
    expect(screen.queryByText('jQuery')).toBeFalsy();

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
    clickOnButton(screen, ButtonTitle.Save);
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
    expectButton(screen, ButtonTitle.Save, true);
    expectButtonInContextMenu(screen, ButtonTitle.Undo, true);

    insertValueIntoTextBox(screen, 'PURL', 'pkg:test/name@version');
    expectValueInTextBox(screen, 'Name', 'name');
    expectValueInTextBox(screen, 'Version', 'version');
    expectButton(screen, ButtonTitle.Save, false);
    expectButtonInContextMenu(screen, ButtonTitle.Undo, false);
    clickOnButton(screen, ButtonTitle.Save);

    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {
        uuid_1: {
          attributionConfidence: 80,
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
    clickOnButtonInContextMenu(screen, ButtonTitle.Undo);

    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueNotInTextBox(screen, 'Name', 'Angular');

    insertValueIntoTextBox(screen, 'Name', 'Angular');
    clickOnButton(screen, ButtonTitle.Save);

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
    clickOnButton(screen, ButtonTitle.Save);

    expect(screen.queryByText('jQuery, 16.0.0')).toBeFalsy();
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
          },
          uuid_2: {
            packageName: 'React',
            packageVersion: '16.0.0',
            comment: 'ManualPackage',
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

    clickOnButtonInContextMenu(screen, ButtonTitle.MarkForReplacement);

    fireEvent.click(screen.getByText('React, 16.0.0') as Element);
    expectValueInTextBox(screen, 'Name', 'React');
    screen.getByText('/root/src/file_2');

    clickOnButtonInContextMenu(screen, ButtonTitle.ReplaceMarkedBy);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonTitle.Cancel);
    expect(screen.queryByText('jQuery, 16.0.0')).toBeTruthy();
    expectReplaceAttributionPopupIsNotShown(screen);

    clickOnButtonInContextMenu(screen, ButtonTitle.ReplaceMarkedBy);
    expectReplaceAttributionPopupIsShown(screen);
    clickOnButton(screen, ButtonTitle.Replace);
    expectValueInTextBox(screen, 'Name', 'React');
    expectReplaceAttributionPopupIsNotShown(screen);
    expect(screen.queryByText('jQuery, 16.0.0')).toBeFalsy();
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
