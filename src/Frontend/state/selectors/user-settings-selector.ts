// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type UserSettings } from '../../../shared/shared-types';
import { type State } from '../../types/types';

export function getUserSettings(state: State): UserSettings {
  return state.userSettingsState;
}
