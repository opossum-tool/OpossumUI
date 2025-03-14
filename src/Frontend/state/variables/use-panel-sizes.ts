// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_PANEL_SIZES } from '../../../shared/shared-constants';
import { useUserSetting } from './use-user-setting';

export const usePanelSizes = () => {
  return useUserSetting({
    defaultValue: DEFAULT_PANEL_SIZES,
    key: 'panelSizes',
  });
};
