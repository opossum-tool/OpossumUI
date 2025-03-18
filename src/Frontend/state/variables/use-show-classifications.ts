// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../hooks';
import { getShowClassifications } from '../selectors/user-settings-selector';

export const SHOW_CLASSIFICATIONS_KEY = 'showClassifications';

export function useShowClassifications() {
  return useAppSelector(getShowClassifications);
}
