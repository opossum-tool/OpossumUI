// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PanelSizes, UserSettings } from '../../../../shared/shared-types';
import { State } from '../../../types/types';
import {
  getAreHiddenSignalsVisible,
  getPanelSizes,
} from '../../selectors/user-settings-selector';
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

export function updateUserSettings(
  userSettings: Partial<UserSettings>,
): AppThunkAction {
  return async (dispatch) => {
    await window.electronAPI.setUserSettings(userSettings);
    dispatch(setUserSetting(userSettings));
  };
}

export function updatePanelSizes(
  panelSizes: Partial<PanelSizes>,
): AppThunkAction {
  return (dispatch, getState): void => {
    const currentState = getState();
    const currentPanelSizes = getPanelSizes(currentState);
    dispatch(
      updateUserSettings({
        panelSizes: { ...currentPanelSizes, ...panelSizes },
      }),
    );
  };
}

export function toggleAreHiddenSignalsVisible(
  dispatch: AppThunkDispatch,
  getState: () => State,
): void {
  const currentState = getState();
  const currentAreHiddenSignalsVisible =
    getAreHiddenSignalsVisible(currentState);
  dispatch(
    updateUserSettings({
      areHiddenSignalsVisible: !currentAreHiddenSignalsVisible,
    }),
  );
}
