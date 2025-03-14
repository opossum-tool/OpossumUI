// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import settings from 'electron-settings';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { UserSettings as IUserSettings } from '../../shared/shared-types';

const DEFAULT_USER_SETTINGS = {
  showClassifications: true,
};

export class UserSettings {
  public static async init() {
    if (process.argv.includes('--reset') || process.env.RESET) {
      log.info('Resetting user settings');
      await settings.set(DEFAULT_USER_SETTINGS);
    }
  }

  public static get<T extends keyof IUserSettings>(
    path: T,
  ): Promise<IUserSettings[T]> {
    return settings.get(path) as Promise<IUserSettings[T]>;
  }

  public static async set<T extends keyof IUserSettings>(
    path: T,
    value: IUserSettings[T],
    { skipNotification }: { skipNotification?: boolean } = {},
  ): Promise<void> {
    await settings.set(path, value);

    if (!skipNotification) {
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send(AllowedFrontendChannels.UserSettingsChanged, {
          path,
          value,
        });
      });
    }
  }
}
