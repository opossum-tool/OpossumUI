// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_USER_SETTINGS } from '../../../shared/shared-constants';
import type { UserSettings } from '../../../shared/shared-types';
import {
  ACTION_SET_USER_SETTING,
  ACTION_USER_SETTINGS_LOADED,
  type UserSettingsAction,
} from '../actions/user-settings-actions/types';

export function userSettingsState(
  state: UserSettings = DEFAULT_USER_SETTINGS,
  action: UserSettingsAction,
): UserSettings {
  switch (action.type) {
    case ACTION_SET_USER_SETTING:
    case ACTION_USER_SETTINGS_LOADED:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

export function userSettingsLoaded(
  state = false,
  action: UserSettingsAction,
): boolean {
  return action.type === ACTION_USER_SETTINGS_LOADED ? true : state;
}
