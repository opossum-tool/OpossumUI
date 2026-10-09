// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindowConstructorOptions, Rectangle } from 'electron';

import { createWindow } from '../createWindow';
import {
  resetWorkAreaSize,
  setNearestPointWorkAreaSize,
  setWorkAreaSize,
} from './electron-mocks';

vi.mock('electron', async () => ({
  app: {
    on: vi.fn(),
    getPath: vi.fn(),
    getName: vi.fn(),
    getVersion: vi.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
    isPackaged: true,
  },
  BrowserWindow: class BrowserWindowMock {
    constructor(options: BrowserWindowConstructorOptions) {
      const bounds: Rectangle = {
        x: 0,
        y: 0,
        width: options.width ? Number(options.width) : 0,
        height: options.height ? Number(options.height) : 0,
      };
      return {
        ...options,
        getBounds: (): Rectangle => bounds,
        maximize: vi.fn(),
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
  ...(await import('./electron-mocks')).menuMock,
  ...(await import('./electron-mocks')).screenMock,
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
  afterEach(() => {
    resetWorkAreaSize();
  });

  it('returns correct BrowserWindow in production', () => {
    const browserWindow = createWindow();
    expect(browserWindow.webContents.openDevTools).not.toHaveBeenCalled();
    expect(browserWindow.loadURL).not.toHaveBeenCalledWith(
      'http://localhost:3000',
    );
  });

  it('uses the default size when the screen is significantly larger', () => {
    setNearestPointWorkAreaSize(2500, 1600);
    const browserWindow = createWindow();
    expect(browserWindow.getBounds().width).toBe(1920);
    expect(browserWindow.getBounds().height).toBe(1080);
    expect(browserWindow.maximize).not.toHaveBeenCalled();
  });

  it('opens maximized when the default size is close to the work area size', () => {
    setNearestPointWorkAreaSize(2000, 1180);
    const browserWindow = createWindow();
    expect(browserWindow.maximize).toHaveBeenCalled();
  });

  it('opens maximized and fills the work area on small screens', () => {
    setNearestPointWorkAreaSize(1600, 900);
    const browserWindow = createWindow();
    expect(browserWindow.getBounds().width).toBe(1600);
    expect(browserWindow.getBounds().height).toBe(900);
    expect(browserWindow.maximize).toHaveBeenCalled();
  });

  it('sizes the window using the display nearest to the cursor, not the primary display', () => {
    setWorkAreaSize(1536, 912);
    setNearestPointWorkAreaSize(1920, 1032);
    const browserWindow = createWindow();
    expect(browserWindow.getBounds()).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1032,
    });
    expect(browserWindow.maximize).toHaveBeenCalled();
  });
});
