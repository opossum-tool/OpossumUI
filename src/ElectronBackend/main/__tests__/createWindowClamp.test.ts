// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createWindow } from '../createWindow';

const { getPrimaryDisplay, browserWindowOptions } = vi.hoisted(() => ({
  getPrimaryDisplay: vi.fn(),
  browserWindowOptions: [] as Array<Electron.BrowserWindowConstructorOptions>,
}));

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
    constructor(options: Electron.BrowserWindowConstructorOptions) {
      browserWindowOptions.push(options);
    }
  },
  screen: {
    getPrimaryDisplay,
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
  it('uses the default size on a screen large enough for it', () => {
    getPrimaryDisplay.mockReturnValue({
      workAreaSize: { width: 1920, height: 1080 },
    });

    createWindow();

    expect(browserWindowOptions.at(-1)).toEqual(
      expect.objectContaining({ width: 1920, height: 1080 }),
    );
  });

  it('clamps the window size to the screen work area', () => {
    getPrimaryDisplay.mockReturnValue({
      workAreaSize: { width: 1366, height: 768 },
    });

    createWindow();

    expect(browserWindowOptions.at(-1)).toEqual(
      expect.objectContaining({ width: 1366, height: 768 }),
    );
  });

  it('clamps the default size below the screen work area', () => {
    getPrimaryDisplay.mockReturnValue({
      workAreaSize: { width: 4096, height: 2160 },
    });

    createWindow();

    expect(browserWindowOptions.at(-1)).toEqual(
      expect.objectContaining({ width: 1920, height: 1080 }),
    );
  });

  it('keeps the minimum window size constraints', () => {
    getPrimaryDisplay.mockReturnValue({
      workAreaSize: { width: 5000, height: 5000 },
    });

    createWindow();

    expect(browserWindowOptions.at(-1)).toEqual(
      expect.objectContaining({ minWidth: 500, minHeight: 400 }),
    );
  });
});
