// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import settings from 'electron-settings';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { UserSettings as IUserSettings } from '../../shared/shared-types';

export class UserSettings {
  public static async init() {
    if (process.argv.includes('--reset')) {
      await settings.set({});
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
