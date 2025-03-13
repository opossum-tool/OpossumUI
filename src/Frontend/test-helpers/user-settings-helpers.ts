// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../shared/shared-types';
import { setVariable } from '../state/actions/variables-actions/variables-actions';

export function setUserSetting<T extends keyof UserSettings>(
  key: T,
  value: NonNullable<UserSettings[T]>,
) {
  return setVariable(key, {
    hydrated: true,
    storedValue: value,
  });
}
