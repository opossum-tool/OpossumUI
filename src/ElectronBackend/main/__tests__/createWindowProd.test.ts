// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createWindow } from '../createWindow';

jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    getPath: jest.fn(),
    getName: jest.fn(),
    getVersion: jest.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
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

jest.mock('electron-is-dev', () => false);
jest.mock('../iconHelpers', () => ({
  getIconPath: (): string => {
    return 'icon/path.png';
  },
  getIconBasedOnTheme: (): string => {
    return 'icon/path-black.png';
  },
}));

describe('createWindow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns correct BrowserWindow in production', async () => {
    const browserWindow = await createWindow();
    expect(browserWindow.webContents.openDevTools).not.toHaveBeenCalled();
    expect(browserWindow.loadURL).not.toHaveBeenCalledWith(
      'http://localhost:3000',
    );
  });
});
