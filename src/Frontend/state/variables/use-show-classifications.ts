// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useUserSetting } from './use-user-setting';

export const SHOW_CLASSIFICATIONS_KEY = 'showClassifications';

export function useShowClassifications() {
  return useUserSetting({
    key: SHOW_CLASSIFICATIONS_KEY,
    defaultValue: true,
  });
}
