// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import { AppImageUpdater, NsisUpdater } from 'electron-updater';
import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  createInstallerUpdater,
  supportsInstallation,
} from '../installer-updater';

vi.mock('electron', () => ({
  app: { isPackaged: true, getPath: () => '/app/OpossumUI.exe' },
}));
vi.mock('node:fs', () => ({ existsSync: vi.fn().mockReturnValue(true) }));
vi.mock('electron-updater', () => ({
  AppImageUpdater: vi.fn(class {}),
  NsisUpdater: vi.fn(class {}),
}));
const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const originalIsPackaged = app.isPackaged;
beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  Object.defineProperty(app, 'isPackaged', {
    configurable: true,
    value: true,
  });
  vi.mocked(existsSync).mockReturnValue(true);
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: 'win32',
  });
});
afterEach(() => {
  Object.defineProperty(process, 'platform', originalPlatform);
  Object.defineProperty(app, 'isPackaged', {
    configurable: true,
    value: originalIsPackaged,
  });
  vi.unstubAllEnvs();
});

test.each(['win32', 'linux'])(
  'disables implicit download and installation for %s',
  (platform) => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: platform,
    });
    if (platform === 'linux') {
      vi.stubEnv('APPIMAGE', '/app/OpossumUI.AppImage');
    }
    expect(createInstallerUpdater()).toMatchObject({
      autoDownload: false,
      autoInstallOnAppQuit: false,
      allowDowngrade: false,
      disableWebInstaller: true,
      disableDifferentialDownload: true,
    });
    expect(
      platform === 'win32' ? NsisUpdater : AppImageUpdater,
    ).toHaveBeenCalledTimes(1);
  },
);
test.each([
  ['macOS', 'darwin', true, true, '', ''],
  ['unpackaged app', 'win32', false, true, '', ''],
  ['portable Windows', 'win32', true, false, '', ''],
  ['Snap', 'linux', true, true, '/app/OpossumUI.AppImage', '/snap/app'],
  ['Linux without AppImage', 'linux', true, true, '', ''],
] as const)(
  'throws without constructing an updater for %s',
  (_name, platform, packaged, hasUninstaller, appImage, snap) => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: platform,
    });
    Object.defineProperty(app, 'isPackaged', {
      configurable: true,
      value: packaged,
    });
    vi.mocked(existsSync).mockReturnValue(hasUninstaller);
    vi.stubEnv('APPIMAGE', appImage);
    vi.stubEnv('SNAP', snap);

    expect(() => createInstallerUpdater()).toThrow(
      'Automatic installation is not supported for this installation.',
    );
    expect(NsisUpdater).not.toHaveBeenCalled();
    expect(AppImageUpdater).not.toHaveBeenCalled();
  },
);

test('keeps unpacked or portable Windows builds on manual download links', () => {
  vi.mocked(existsSync).mockReturnValue(false);
  expect(supportsInstallation()).toBe(false);
  expect(existsSync).toHaveBeenCalledWith(
    path.join('/app', 'Uninstall OpossumUI.exe'),
  );
});
