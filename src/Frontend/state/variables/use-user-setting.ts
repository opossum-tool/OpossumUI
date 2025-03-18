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
} from '../actions/user-settings-actions/user-settings-actions';
import { useAppDispatch } from '../hooks';

// should only be called once
export function useInitialSyncUserSettings() {
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
