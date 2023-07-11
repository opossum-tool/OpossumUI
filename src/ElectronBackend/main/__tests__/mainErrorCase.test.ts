// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { dialog, ipcMain } from 'electron';
import { main } from '../main';

jest.mock('../installExtensionsForDev', () => ({
  installExtensionsForDev: jest.fn(),
}));

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  app: {
    on: jest.fn(),
    getPath: jest.fn(),
    getName: jest.fn(),
    getVersion: jest.fn(),
    whenReady: (): Promise<boolean> => Promise.resolve(true),
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: (): void => {
          throw Error('TEST_ERROR');
        },
        webContents: {
          openDevTools: jest.fn(),
        },
      };
    }
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
    getApplicationMenu: jest.fn(),
  },
  dialog: {
    showMessageBox: jest.fn(),
  },
}));
describe('The App backend', () => {
  it('handles errors', async () => {
    // we expect warnings that we do not want to see
    jest.spyOn(console, 'log');

    await main();

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Error',
      }),
    );

    expect(ipcMain.handle).toHaveBeenCalledTimes(0);
  });
});
