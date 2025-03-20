// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, MenuItemConstructorOptions } from 'electron';

import { UserSettings as IUserSettings } from '../../../shared/shared-types';
import { getCheckboxBasedOnThemeAndCheckState } from '../iconHelpers';
import { createMenu } from '../menu';
import { UserSettings } from '../user-settings';

export interface SwitchableItemOptions {
  id: string;
  label: string;
  userSettingsKey: keyof IUserSettings;
}

export async function switchableMenuItem(
  mainWindow: BrowserWindow,
  options: SwitchableItemOptions,
): Promise<MenuItemConstructorOptions> {
  const state = !!(await UserSettings.get(options.userSettingsKey));
  return {
    icon: getCheckboxBasedOnThemeAndCheckState(state),
    id: state ? `enabled-${options.id}` : `disabled-${options.id}`,
    label: options.label,
    click: async () => {
      await UserSettings.set(options.userSettingsKey, !state);
      await createMenu(mainWindow);
    },
  };
}
