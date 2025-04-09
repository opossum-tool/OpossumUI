// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions } from 'electron';

import { UserSettings as IUserSettings } from '../../../shared/shared-types';
import { getCheckboxBasedOnThemeAndCheckState } from '../iconHelpers';
import { UserSettingsService } from '../user-settings-service';

interface SwitchableItemOptions {
  id: string;
  label: string;
  userSettingsKey: keyof IUserSettings;
}

export async function switchableMenuItem(
  updateMenu: () => Promise<void>,
  options: SwitchableItemOptions,
): Promise<MenuItemConstructorOptions> {
  const state = !!(await UserSettingsService.get(options.userSettingsKey));
  return {
    icon: getCheckboxBasedOnThemeAndCheckState(state),
    id: state ? `enabled-${options.id}` : `disabled-${options.id}`,
    label: options.label,
    click: async () => {
      await UserSettingsService.update(
        Object.fromEntries([[options.userSettingsKey, !state]]),
      );
      await updateMenu();
    },
  };
}
