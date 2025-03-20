// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from '../../../shared/shared-types';
import { State } from '../../types/types';

export function getUserSettings(state: State): UserSettings {
  return state.userSettingsState;
}

export function getShowCriticality(state: State): boolean {
  return state.userSettingsState.showCriticality;
}

export function getShowClassifications(state: State): boolean {
  return state.userSettingsState.showClassifications;
}

export function getQaMode(state: State): boolean {
  return state.userSettingsState.qaMode;
}

export function getShowProjectStatistics(state: State): boolean {
  return state.userSettingsState.showProjectStatistics;
}

export function getAreHiddenSignalsVisible(state: State): boolean {
  return state.userSettingsState.areHiddenSignalsVisible;
}

export function getPanelSizes(state: State): UserSettings['panelSizes'] {
  return state.userSettingsState.panelSizes;
}
