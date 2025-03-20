// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PanelSizes, UserSettings } from '../../../shared/shared-types';
import { updateUserSettings } from '../actions/user-settings-actions/user-settings-actions';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getPanelSizes } from '../selectors/user-settings-selector';

export const usePanelSizes = (): {
  panelSizes: PanelSizes;
  setPanelSizes: (panelsSizes: Partial<PanelSizes>) => void;
} => {
  const panelSizes = useAppSelector(getPanelSizes);
  const dispatch = useAppDispatch();
  const setPanelSizes = (panelSizes: Partial<PanelSizes>) =>
    dispatch(
      updateUserSettings((currentSettings: UserSettings) => ({
        panelSizes: { ...currentSettings.panelSizes, ...panelSizes },
      })),
    );
  return { panelSizes, setPanelSizes };
};
