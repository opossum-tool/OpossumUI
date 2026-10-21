// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { dialog, ipcMain } from 'electron';

import { main } from '../main';
import { startAutomaticUpdateChecks } from '../update-service';
import { UserSettingsService } from '../user-settings-service';

vi.mock('../update-service', () => ({
  startAutomaticUpdateChecks: vi.fn(),
  stopAutomaticUpdateChecks: vi.fn(),
}));
vi.mock('../user-settings-service', () => ({
  UserSettingsService: {
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(false),
  },
}));

// Mock electron-settings before electron to prevent initialization errors
vi.mock('electron-settings', () => ({
  default: {
    get: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    configure: vi.fn(),
  },
}));

vi.mock('electron', async () => ({
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
        maximize: vi.fn(),
        webContents: {
          openDevTools: vi.fn(),
        },
      };
    }
  },
  ...(await import('./electron-mocks')).menuMock,
  ...(await import('./electron-mocks')).screenMock,
  dialog: {
    showMessageBox: vi.fn(),
  },
}));
describe('The App backend', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('handles errors', async () => {
    await main();

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Error',
      }),
    );

    expect(ipcMain.handle).toHaveBeenCalledTimes(0);
    expect(UserSettingsService.get).toHaveBeenCalledWith(
      'automaticallyCheckForUpdates',
    );
    expect(startAutomaticUpdateChecks).not.toHaveBeenCalled();
  });

  it('starts update polling only when the saved preference is enabled', async () => {
    vi.mocked(UserSettingsService.get).mockResolvedValueOnce(true as never);
    await main();
    expect(UserSettingsService.get).toHaveBeenCalledWith(
      'automaticallyCheckForUpdates',
    );
    expect(startAutomaticUpdateChecks).toHaveBeenCalledOnce();
  });
});
