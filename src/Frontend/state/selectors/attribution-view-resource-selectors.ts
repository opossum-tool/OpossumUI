// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { State } from '../../types/types';

export function getTargetSelectedAttributionId(state: State): string | null {
  return state.resourceState.attributionView.targetSelectedAttributionId;
}

export function getSelectedAttributionIdInAttributionView(
  state: State,
): string {
  return state.resourceState.attributionView.selectedAttributionId;
}

export function getMultiSelectSelectedAttributionIds(
  state: State,
): Array<string> {
  return state.resourceState.attributionView.multiSelectSelectedAttributionIds;
}
