// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ipcMain } from 'electron';
import { IpcChannel } from '../../../shared/ipc-channels';
import { main } from '../main';

jest.mock('../createWindow', () => ({
  createWindow: (): unknown => {
    return {
      webContents: jest.fn(),
    };
  },
}));

jest.mock('../installExtensionsForDev', () => ({
  installExtensionsForDev: jest.fn(),
}));

jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  app: {
    on: jest.fn(),
    getPath: jest.fn(),
    whenReady: (): Promise<boolean> => Promise.resolve(true),
    getName: jest.fn(),
    getVersion: jest.fn(),
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: jest.fn,
        webContents: {
          openDevTools: jest.fn(),
        },
      };
    }
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
  },
  dialog: {
    showMessageBox: jest.fn(),
  },
  systemPreferences: {
    setUserDefault: jest.fn(),
  },
}));

describe('The App backend', () => {
  test('calls ipc handler', async () => {
    await main();

    expect(ipcMain.handle).toHaveBeenCalledTimes(5);
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      1,
      IpcChannel.OpenFile,
      expect.any(Function)
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      2,
      IpcChannel.SaveFile,
      expect.any(Function)
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      3,
      IpcChannel.SendErrorInformation,
      expect.any(Function)
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      4,
      IpcChannel.ExportFile,
      expect.any(Function)
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      5,
      IpcChannel.OpenLink,
      expect.any(Function)
    );
  });
});
