// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PanelSizes } from '../../../shared/shared-types';
import { setUserSetting } from '../actions/user-settings-actions/user-settings-actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getUserSettings } from '../selectors/user-settings-selector';
import type { AppThunkAction } from '../types';

function setPanelSizesThunk(
  panelSizesPatch: Partial<PanelSizes>,
): AppThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const panelSizes = {
      ...getUserSettings(getState()).panelSizes,
      ...panelSizesPatch,
    };
    dispatch(setUserSetting({ panelSizes }));
    await window.electronAPI.updateUserSettings({ panelSizes });
  };
}

export const usePanelSizes = (): {
  panelSizes: PanelSizes;
  setPanelSizes: (panelsSizes: Partial<PanelSizes>) => void;
} => {
  const panelSizes = useAppSelector(getUserSettings).panelSizes;
  const dispatch = useAppDispatch();
  const setPanelSizes = (panelSizes: Partial<PanelSizes>) =>
    void dispatch(setPanelSizesThunk(panelSizes));
  return { panelSizes, setPanelSizes };
};
