// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import settings from 'electron-settings';
import { isEqual } from 'lodash';

import { UserSettings as IUserSettings } from '../../shared/shared-types';

export class UserSettings {
  public static async init() {
    const current: Partial<IUserSettings> = await settings.get();
    const reset = process.argv.includes('--reset');

    const updated = {
      ...current,
      showProjectStatistics: reset
        ? false
        : current.showProjectStatistics ?? true,
      qaMode: reset ? false : current.qaMode ?? false,
    } satisfies IUserSettings;

    if (!isEqual(current, updated)) {
      await settings.set(updated);
    }
  }

  public static get<T extends keyof IUserSettings>(
    path: T,
  ): Promise<IUserSettings[T]> {
    return settings.get(path) as Promise<IUserSettings[T]>;
  }

  public static set<T extends keyof IUserSettings>(
    path: T,
    value: IUserSettings[T],
  ): Promise<void> {
    return settings.set(path, value);
  }
}
