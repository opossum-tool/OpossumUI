// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../../../shared/shared-types';

export interface SetUserSetting {
  type: typeof ACTION_SET_USER_SETTING;
  payload: Partial<UserSettings>;
}

export const ACTION_SET_USER_SETTING = 'ACTION_SET_USER_SETTING';

export type UserSettingsAction = SetUserSetting;
