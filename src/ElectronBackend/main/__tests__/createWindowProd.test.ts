// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createWindow } from '../createWindow';

vi.mock('electron', () => ({
  app: {
    on: vi.fn(),
    getPath: vi.fn(),
    getName: vi.fn(),
    getVersion: vi.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
    isPackaged: true,
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: vi.fn(),
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
  Menu: {
    setApplicationMenu: vi.fn(),
    buildFromTemplate: vi.fn(),
    getApplicationMenu: vi.fn(),
  },
}));

vi.mock('../iconHelpers', () => ({
  getIconPath: (): string => {
    return 'icon/path.png';
  },
  getIconBasedOnTheme: (): string => {
    return 'icon/path-black.png';
  },
}));

describe('createWindow', () => {
  it('returns correct BrowserWindow in production', () => {
    const browserWindow = createWindow();
    expect(browserWindow.webContents.openDevTools).not.toHaveBeenCalled();
    expect(browserWindow.loadURL).not.toHaveBeenCalledWith(
      'http://localhost:3000',
    );
  });
});
