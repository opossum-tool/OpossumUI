// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
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
    getApplicationMenu: jest.fn(),
  },
  dialog: {
    showMessageBox: jest.fn(),
  },
  systemPreferences: {
    setUserDefault: jest.fn(),
  },
}));

describe('The App backend', () => {
  it('calls ipc handler', async () => {
    await main();

    const expectedTotalNumberOfCalls = 10;
    expect(ipcMain.handle).toHaveBeenCalledTimes(expectedTotalNumberOfCalls);
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      1,
      IpcChannel.ConvertInputFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      2,
      IpcChannel.UseOutdatedInputFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      3,
      IpcChannel.OpenDotOpossumFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      4,
      IpcChannel.OpenFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      5,
      IpcChannel.SaveFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      6,
      IpcChannel.DeleteFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      7,
      IpcChannel.KeepFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      8,
      IpcChannel.SendErrorInformation,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      9,
      IpcChannel.ExportFile,
      expect.any(Function),
    );
    expect(ipcMain.handle).toHaveBeenNthCalledWith(
      expectedTotalNumberOfCalls,
      IpcChannel.OpenLink,
      expect.any(Function),
    );
  });
});
