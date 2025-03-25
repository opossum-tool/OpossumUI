// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { UserSettings } from '../../../shared/shared-types';
import { State } from '../../types/types';
import {
  useIpcRenderer,
  UserSettingsChangedListener,
} from '../../util/use-ipc-renderer';
import {
  fetchUserSettings,
  setUserSetting,
} from '../actions/user-settings-actions/user-settings-actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getUserSettings } from '../selectors/user-settings-selector';

type UpdateUserSettingsArguments =
  | Partial<UserSettings>
  | ((currentSettings: UserSettings) => Partial<UserSettings>);

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

function getUserSettingsToSet(
  userSettings: UpdateUserSettingsArguments,
  getState: () => State,
): Partial<UserSettings> {
  if (typeof userSettings === 'function') {
    const currentUserSettings = getUserSettings(getState());
    return userSettings(currentUserSettings);
  }
  return userSettings;
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
    userSettings: UpdateUserSettingsArguments,
  ): void => {
    void dispatch(async (dispatch, getState) => {
      const userSettingsToSet = getUserSettingsToSet(userSettings, getState);
      await window.electronAPI.updateUserSettings(userSettingsToSet);
      dispatch(setUserSetting(userSettingsToSet));
    });
  };
  return [userSettings, updateUserSettings];
}
