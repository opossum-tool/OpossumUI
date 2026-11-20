// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import type { UserSettings } from '../../../shared/shared-types';
import type { State } from '../../types/types';
import {
  useIpcRenderer,
  type UserSettingsChangedListener,
} from '../../util/use-ipc-renderer';
import {
  fetchUserSettings,
  setUserSetting,
  updateUserSettings,
  updateUserSettingsOptimistically,
} from '../actions/user-settings-actions/user-settings-actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getUserSettings } from '../selectors/user-settings-selector';

type UpdateUserSettingsArguments =
  | Partial<UserSettings>
  | ((currentSettings: UserSettings) => Partial<UserSettings>);

interface UpdateUserSettingsOptions {
  /**
   * Apply the change to the shared state immediately, before it has been
   * persisted. Use for changes the user interacts with right away.
   */
  optimistic?: boolean;
}

export function useInitUserSettings() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    void dispatch(fetchUserSettings()).catch((error: unknown) => {
      console.error('Could not load user settings.', error);
    });
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
    userSettings: UpdateUserSettingsArguments,
    options?: UpdateUserSettingsOptions,
  ) => void,
] {
  const userSettings = useAppSelector(getUserSettings);
  const dispatch = useAppDispatch();

  const updateSettings = (
    userSettings: UpdateUserSettingsArguments,
    { optimistic = false }: UpdateUserSettingsOptions = {},
  ): void => {
    dispatch((dispatch, getState) => {
      const userSettingsToSet = getUserSettingsToSet(userSettings, getState);
      return dispatch(
        optimistic
          ? updateUserSettingsOptimistically(userSettingsToSet)
          : updateUserSettings(userSettingsToSet),
      );
    }).catch((error: unknown) => {
      console.error('Could not update user settings.', error);
    });
  };
  return [userSettings, updateSettings];
}
