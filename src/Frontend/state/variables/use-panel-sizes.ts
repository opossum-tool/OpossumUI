// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../../shared/shared-types';
import { useUserSetting } from './use-user-setting';

export const DEFAULT_PANEL_SIZES: NonNullable<UserSettings['panelSizes']> = {
  resourceBrowserWidth: 340,
  packageListsWidth: 340,
  linkedResourcesPanelHeight: null,
  signalsPanelHeight: null,
};

export const usePanelSizes = () => {
  return useUserSetting({
    defaultValue: DEFAULT_PANEL_SIZES,
    key: 'panelSizes',
  });
};
