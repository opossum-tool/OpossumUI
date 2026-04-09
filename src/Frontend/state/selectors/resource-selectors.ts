// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AttributionData,
  type Attributions,
  type AttributionsToResources,
  type ClassificationsConfig,
  type PackageInfo,
  type ProjectMetadata,
  type ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { type State } from '../../types/types';

export function getManualData(state: State): AttributionData {
  return state.resourceState.manualData;
}

export function getManualAttributions(state: State): Attributions {
  return state.resourceState.manualData.attributions;
}

export function getSelectedAttributionId(state: State): string {
  return state.resourceState.selectedAttributionId;
}

export function getTargetSelectedAttributionId(state: State): string | null {
  return state.resourceState.targetSelectedAttributionId;
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

export function getManualAttributionsToResources(
  state: State,
): AttributionsToResources {
  return state.resourceState.manualData.attributionsToResources;
}

export function getResourcesWithManualAttributedChildren(
  state: State,
): ResourcesWithAttributedChildren {
  return state.resourceState.manualData.resourcesWithAttributedChildren;
}

export function getTemporaryDisplayPackageInfo(state: State): PackageInfo {
  return state.resourceState.temporaryDisplayPackageInfo;
}

export function getFilesWithChildren(state: State): Set<string> {
  return state.resourceState.filesWithChildren;
}

export function getProjectMetadata(state: State): ProjectMetadata {
  return state.resourceState.metadata;
}

export function getClassifications(state: State): ClassificationsConfig {
  return state.resourceState.config.classifications;
}

export function getIsPackageInfoDirty(state: State): boolean {
  return state.resourceState.isPackageInfoDirty;
}
