// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PackageInfo } from '../../../shared/shared-types';
import type { State } from '../../types/types';
import type { TargetAttributionFilterChange } from '../actions/resource-actions/types';

export function getSelectedAttributionId(state: State): string {
  return state.resourceState.selectedAttributionId;
}

export function getTargetSelectedAttributionId(state: State): string | null {
  return state.resourceState.targetSelectedAttributionId;
}

export function getTargetAttributionFilterChange(
  state: State,
): TargetAttributionFilterChange | null {
  return state.resourceState.targetAttributionFilterChange;
}

export function getExpandedIds(state: State): Array<string> {
  return state.resourceState.expandedIds;
}

export function getTargetSelectedResourceId(state: State): string | null {
  return state.resourceState.targetSelectedResourceId;
}

export function getSelectedResourceId(state: State): string {
  return state.resourceState.selectedResourceId;
}

export function getTemporaryDisplayPackageInfo(state: State): PackageInfo {
  return state.resourceState.temporaryDisplayPackageInfo;
}

export function getIsPackageInfoDirty(state: State): boolean {
  return state.resourceState.isPackageInfoDirty;
}
