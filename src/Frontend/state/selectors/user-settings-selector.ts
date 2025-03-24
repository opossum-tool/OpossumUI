// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../../shared/shared-types';
import { State } from '../../types/types';

export function getUserSettings(state: State): UserSettings {
  return state.userSettingsState;
}
