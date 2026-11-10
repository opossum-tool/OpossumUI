// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { UserSettings } from '../../../../shared/shared-types';

export interface SetUserSetting {
  type: typeof ACTION_SET_USER_SETTING;
  payload: Partial<UserSettings>;
}

export const ACTION_SET_USER_SETTING = 'ACTION_SET_USER_SETTING';
export const ACTION_USER_SETTINGS_LOADED = 'ACTION_USER_SETTINGS_LOADED';

interface UserSettingsLoaded {
  type: typeof ACTION_USER_SETTINGS_LOADED;
  payload: UserSettings;
}

export type UserSettingsAction = SetUserSetting | UserSettingsLoaded;
