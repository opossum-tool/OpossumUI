// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { debounce } from 'lodash';

import { RAGE_DEBOUNCE_TIME } from '../../shared-constants';
import { useUserSetting } from './use-user-setting';

export const ARE_HIDDEN_SIGNALS_VISIBLE = 'are-hidden-signals-visible';

export function useAreHiddenSignalsVisible() {
  const [areHiddenSignalsVisible, setAreHiddenSignalsVisible] = useUserSetting({
    defaultValue: false,
    key: 'areHiddenSignalsVisible',
  });

  return [
    areHiddenSignalsVisible,
    debounce(setAreHiddenSignalsVisible, RAGE_DEBOUNCE_TIME),
  ] as const;
}
