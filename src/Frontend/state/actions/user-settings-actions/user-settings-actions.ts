// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../../../shared/shared-types';
import { AppThunkAction } from '../../types';
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
