// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import settings from 'electron-settings';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { DEFAULT_USER_SETTINGS } from '../../shared/shared-constants';
import {
  UserSettings as IUserSettings,
  UserSettings,
} from '../../shared/shared-types';

let settingsLock: Promise<unknown> = Promise.resolve();

/**
 * To ensure that we don't try to update the settings concurrently. Otherwise, we get EPERM errors under Windows.
 */
async function withSettingsLock<T>(fn: () => Promise<T>): Promise<T> {
  const execute = settingsLock.then(fn);
  settingsLock = execute.catch((e) => {
    console.error('Settings command failed with error', e);
  });
  return execute;
}

export class UserSettingsService {
  public static async init() {
    return withSettingsLock(async () => {
      if (process.argv.includes('--reset') || process.env.RESET) {
        log.info('Resetting user settings');
        await settings.set(DEFAULT_USER_SETTINGS as unknown as never);
      } else {
        const currentSettings = await settings.get();
        await settings.set({
          ...DEFAULT_USER_SETTINGS,
          ...currentSettings,
        });
      }
    });
  }

  public static async get<T extends keyof IUserSettings>(
    path: T,
  ): Promise<IUserSettings[T]>;
  public static async get(): Promise<IUserSettings>;
  public static async get<T extends keyof IUserSettings>(
    path?: T,
  ): Promise<IUserSettings[T] | IUserSettings> {
    return withSettingsLock(async () => {
      return path
        ? ((await settings.get(path)) as IUserSettings[T])
        : ((await settings.get()) as unknown as IUserSettings);
    });
  }

  public static async update(
    userSettings: Partial<IUserSettings>,
    { skipNotification }: { skipNotification: boolean } = {
      skipNotification: false,
    },
  ): Promise<void> {
    return withSettingsLock(async () => {
      for (const key of Object.keys(userSettings)) {
        const properKey = key as keyof UserSettings;
        if (userSettings[properKey] !== undefined) {
          await settings.set(properKey, userSettings[properKey]);
        }
      }
      if (!skipNotification) {
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(
            AllowedFrontendChannels.UserSettingsChanged,
            userSettings,
          );
        });
      }
    });
  }
}
