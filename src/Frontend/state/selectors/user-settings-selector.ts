// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { State } from '../../types/types';

export function getShowCriticality(state: State): boolean {
  return state.userSettingsState.showCriticality;
}

export function getShowClassifications(state: State): boolean {
  return state.userSettingsState.showClassifications;
}
