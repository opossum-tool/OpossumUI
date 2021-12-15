// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { State } from '../../types/types';
import { getManualAttributionsToResources } from './all-views-resource-selectors';

export function getSelectedAttributionId(state: State): string {
  return state.resourceState.attributionView.selectedAttributionId;
}

export function getTargetSelectedAttributionId(state: State): string {
  return state.resourceState.attributionView.targetSelectedAttributionId;
}

export function getResourceIdsOfSelectedAttribution(
  state: State
): Array<string> {
  const attributionId = getSelectedAttributionId(state);
  const manualAttributionsToResources = getManualAttributionsToResources(state);

  if (attributionId in manualAttributionsToResources) {
    return manualAttributionsToResources[attributionId];
  }
  return [];
}

export function getMultiSelectMode(state: State): boolean {
  return state.resourceState.attributionView.multiSelectMode;
}

export function getMultiSelectSelectedAttributionIds(
  state: State
): Array<string> {
  return state.resourceState.attributionView.multiSelectSelectedAttributionIds;
}
