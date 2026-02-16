// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { dialog, ipcMain } from 'electron';

import { main } from '../main';

// Mock electron-settings before electron to prevent initialization errors
vi.mock('electron-settings', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    configure: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  app: {
    on: vi.fn(),
    getPath: vi.fn(() => '/tmp'),
    getName: vi.fn(() => 'OpossumUI'),
    getVersion: vi.fn(() => '1.0.0'),
    whenReady: (): Promise<boolean> => Promise.resolve(true),
    isPackaged: true,
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: (): void => {
          throw Error('TEST_ERROR');
        },
        webContents: {
          openDevTools: vi.fn(),
        },
      };
    }
  },
  Menu: {
    setApplicationMenu: vi.fn(),
    buildFromTemplate: vi.fn(),
    getApplicationMenu: vi.fn(),
  },
  dialog: {
    showMessageBox: vi.fn(),
  },
}));
describe('The App backend', () => {
  it('handles errors', async () => {
    await main();

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Error',
      }),
    );

    expect(ipcMain.handle).toHaveBeenCalledTimes(0);
  });
});
