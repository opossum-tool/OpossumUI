// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { IpcChannel } from '../../../shared/ipc-channels';
import { ParsedFileContent } from '../../../shared/shared-types';
import { DiscreteConfidence, View } from '../../enums/enums';
import { renderComponentWithStore } from '../../test-helpers/render-component-with-store';
import {
  clickOnEditIconForElement,
  clickOnOpenFileIcon,
  EMPTY_PARSED_FILE_CONTENT,
  expectResourceBrowserIsNotShown,
  expectValueInTextBox,
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

describe('The report view', () => {
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

  test('navigates to attribution view', () => {
    const mockChannelReturn: ParsedFileContent = {
      ...EMPTY_PARSED_FILE_CONTENT,
      resources: {
        directory_manual: { subdirectory_manual: { file_manual: 1 } },
      },
      manualAttributions: {
        attributions: {
          uuid_1: {
            attributionConfidence: DiscreteConfidence.High,
            packageName: 'jQuery',
            licenseText: 'MIT',
          },
        },
        resourcesToAttributions: {
          '/directory_manual/subdirectory_manual/': ['uuid_1'],
        },
      },
    };
    mockElectronBackend(mockChannelReturn);
    renderComponentWithStore(<App />);

    clickOnOpenFileIcon(screen);
    goToView(screen, View.Report);
    expectResourceBrowserIsNotShown(screen);

    screen.getByText('Name');
    screen.getByText('License');
    screen.getByText('License Text');
    screen.getByText('Resources');
    expect(screen.getAllByText('Name').length).toBe(1);

    screen.getByText('jQuery');
    screen.getByText('MIT');
    screen.getByText('/directory_manual/subdirectory_manual/');
    screen.getByText(`${DiscreteConfidence.High}`);

    clickOnEditIconForElement(screen, 'jQuery');

    expectValueInTextBox(screen, 'Name', 'jQuery');
    expectValueInTextBox(
      screen,
      'License Text (to appear in attribution document)',
      'MIT'
    );
  });
});
