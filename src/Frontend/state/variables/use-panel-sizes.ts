// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PanelSizes, UserSettings } from '../../../shared/shared-types';
import { useUserSettings } from './use-user-setting';

export const usePanelSizes = (): {
  panelSizes: PanelSizes;
  setPanelSizes: (panelsSizes: Partial<PanelSizes>) => void;
} => {
  const [userSettings, updateUserSettings] = useUserSettings();
  const panelSizes = userSettings.panelSizes;
  const setPanelSizes = (panelSizes: Partial<PanelSizes>) =>
    updateUserSettings((currentSettings: UserSettings) => ({
      panelSizes: { ...currentSettings.panelSizes, ...panelSizes },
    }));
  return { panelSizes, setPanelSizes };
};
