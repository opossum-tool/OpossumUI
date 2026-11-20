// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { UserSettings } from '../../../../shared/shared-types';
import type { AppThunkAction } from '../../types';
import {
  ACTION_SET_USER_SETTING,
  ACTION_USER_SETTINGS_LOADED,
  type SetUserSetting,
} from './types';

export function setUserSetting(setting: Partial<UserSettings>): SetUserSetting {
  return {
    type: ACTION_SET_USER_SETTING,
    payload: setting,
  };
}

export function fetchUserSettings(): AppThunkAction<Promise<void>> {
  return async (dispatch) => {
    const userSettings = await window.electronAPI.getUserSettings();
    dispatch({ type: ACTION_USER_SETTINGS_LOADED, payload: userSettings });
  };
}

export function updateUserSettings(
  settings: Partial<UserSettings>,
): AppThunkAction<Promise<void>> {
  return async (dispatch) => {
    await window.electronAPI.updateUserSettings(settings);
    dispatch(setUserSetting(settings));
  };
}

/**
 * Applies the settings change locally right away and persists it in the
 * background. Use this for changes the user interacts with immediately after
 * (e.g. the quickfilter lists): with the pessimistic
 * {@link updateUserSettings} the UI would keep showing the old value until
 * the IPC round-trip has completed, which is observable on slow machines.
 * If persisting fails, the optimistic value is rolled back to the persisted
 * truth and the error is rethrown.
 */
export function updateUserSettingsOptimistically(
  settings: Partial<UserSettings>,
): AppThunkAction<Promise<void>> {
  return async (dispatch) => {
    dispatch(setUserSetting(settings));
    try {
      await window.electronAPI.updateUserSettings(settings);
    } catch (error) {
      // Do not leave the optimistic value in shared state when it could not
      // be persisted; re-read the persisted settings as the source of truth.
      await dispatch(fetchUserSettings()).catch(() => undefined);
      throw error;
    }
  };
}
