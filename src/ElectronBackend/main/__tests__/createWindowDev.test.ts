// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createWindow, loadWebApp } from '../createWindow';

vi.mock('electron', async () => ({
  app: {
    on: vi.fn(),
    getPath: vi.fn(),
    getName: vi.fn(),
    getVersion: vi.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
    isPackaged: false,
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: vi.fn(),
        maximize: vi.fn(),
        webContents: {
          openDevTools: vi.fn(),
          session: {
            webRequest: {
              onHeadersReceived: vi.fn(),
            },
          },
        },
      };
    }
  },
  ...(await import('./electron-mocks')).menuMock,
  ...(await import('./electron-mocks')).screenMock,
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
