// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createWindow, loadWebApp } from '../createWindow';

jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    getPath: jest.fn(),
    getName: jest.fn(),
    getVersion: jest.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
    isPackaged: false,
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: jest.fn(),
        webContents: {
          openDevTools: jest.fn(),
          session: {
            webRequest: {
              onHeadersReceived: jest.fn(),
            },
          },
        },
      };
    }
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
    getApplicationMenu: jest.fn(),
  },
}));

describe('createWindow', () => {
  it('returns correct BrowserWindow in devMode', async () => {
    const browserWindow = createWindow();
    await loadWebApp(browserWindow);
    expect(browserWindow.webContents.openDevTools).toHaveBeenCalled();
    expect(browserWindow.loadURL).toHaveBeenCalledWith(
      'http://localhost:5173/',
    );
  });
});
