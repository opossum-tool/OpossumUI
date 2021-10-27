// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
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
        },
      };
    }
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
  },
}));

jest.mock('electron-is-dev', () => false);
jest.mock('../iconHelpers', () => ({
  getIconPath: (): string => {
    return 'icon/path.png';
  },
}));

describe('createWindow', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns correct BrowserWindow in production', async () => {
    const browserWindow = await createWindow();
    expect(browserWindow.webContents.openDevTools).not.toHaveBeenCalled();
    expect(browserWindow.loadURL).not.toHaveBeenCalledWith(
      'http://localhost:3000'
    );
  });
});
