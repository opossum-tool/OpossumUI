// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../../../shared/shared-types';
import { State } from '../../../types/types';
import { getUserSettings } from '../../selectors/user-settings-selector';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { ACTION_SET_USER_SETTING, SetUserSetting } from './types';

export function setUserSetting(setting: Partial<UserSettings>): SetUserSetting {
  return {
    type: ACTION_SET_USER_SETTING,
    payload: setting,
  };
}

export function fetchUserSettings(): AppThunkAction {
  return async (dispatch) => {
    const userSettings = await window.electronAPI.getUserSettings();
    dispatch(setUserSetting(userSettings));
  };
}

function getUserSettingsToSet(
  userSettings:
    | Partial<UserSettings>
    | ((currentSettings: UserSettings) => Partial<UserSettings>),
  getState: () => State,
): Partial<UserSettings> {
  if (typeof userSettings === 'function') {
    const currentUserSettings: UserSettings = getUserSettings(getState());
    return userSettings(currentUserSettings);
  }
  return userSettings;
}

export function updateUserSettings(
  userSettings:
    | Partial<UserSettings>
    | ((currentSettings: UserSettings) => Partial<UserSettings>),
): AppThunkAction {
  return async (dispatch: AppThunkDispatch, getState: () => State) => {
    const userSettingsToSet = getUserSettingsToSet(userSettings, getState);
    await window.electronAPI.setUserSettings(userSettingsToSet);
    dispatch(setUserSetting(userSettingsToSet));
  };
}
