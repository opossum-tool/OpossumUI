// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import {
  AppImageUpdater,
  type AppUpdater,
  NsisUpdater,
} from 'electron-updater';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Construct only for packaged NSIS/AppImage installations. Other platforms keep links.
export function createInstallerUpdater(): AppUpdater {
  if (!supportsInstallation()) {
    throw new Error(
      'Automatic installation is not supported for this installation.',
    );
  }
  const updater =
    process.platform === 'win32' ? new NsisUpdater() : new AppImageUpdater();
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.allowDowngrade = false;
  updater.disableWebInstaller = true;
  updater.disableDifferentialDownload = false;
  return updater;
}

export function supportsInstallation(): boolean {
  return (
    app.isPackaged &&
    ((process.platform === 'win32' &&
      existsSync(
        path.join(path.dirname(app.getPath('exe')), 'Uninstall OpossumUI.exe'),
      )) ||
      (process.platform === 'linux' &&
        !!process.env.APPIMAGE &&
        !process.env.SNAP))
  );
}
