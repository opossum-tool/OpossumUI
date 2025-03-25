// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { UserSettings } from '../../../shared/shared-types';
import {
  useIpcRenderer,
  UserSettingsChangedListener,
} from '../../util/use-ipc-renderer';
import {
  fetchUserSettings,
  setUserSetting,
  updateUserSettings as updateUserSettingsThunkAction,
} from '../actions/user-settings-actions/user-settings-actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getUserSettings } from '../selectors/user-settings-selector';

export function useInitUserSettings() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchUserSettings());
  }, [dispatch]);

  useIpcRenderer<UserSettingsChangedListener>(
    AllowedFrontendChannels.UserSettingsChanged,
    (_, updatedSettings: Partial<UserSettings>) =>
      dispatch(setUserSetting(updatedSettings)),
    [dispatch],
  );
}

export function useUserSettings(): [
  UserSettings,
  (
    userSettings:
      | Partial<UserSettings>
      | ((settings: UserSettings) => Partial<UserSettings>),
  ) => void,
] {
  const userSettings = useAppSelector(getUserSettings);
  const dispatch = useAppDispatch();

  const updateUserSettings = (
    userSettings:
      | Partial<UserSettings>
      | ((settings: UserSettings) => Partial<UserSettings>),
  ): void => {
    dispatch(updateUserSettingsThunkAction(userSettings));
  };
  return [userSettings, updateUserSettings];
}
