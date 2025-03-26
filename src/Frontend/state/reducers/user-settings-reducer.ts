// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_USER_SETTINGS } from '../../../shared/shared-constants';
import { UserSettings } from '../../../shared/shared-types';
import {
  ACTION_SET_USER_SETTING,
  UserSettingsAction,
} from '../actions/user-settings-actions/types';

export function userSettingsState(
  state: UserSettings = DEFAULT_USER_SETTINGS,
  action: UserSettingsAction,
): UserSettings {
  switch (action.type) {
    case ACTION_SET_USER_SETTING:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
