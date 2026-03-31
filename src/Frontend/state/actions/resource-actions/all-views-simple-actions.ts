// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Attributions,
  type AttributionsToResources,
  type PackageInfo,
  type ProjectConfig,
  type ProjectMetadata,
  type ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { computeChildrenWithAttributions } from '../../helpers/save-action-helpers';
import {
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_ATTRIBUTION_BREAKPOINTS,
  ACTION_SET_FILES_WITH_CHILDREN,
  ACTION_SET_IS_PACKAGE_INFO_DIRTY,
  ACTION_SET_MANUAL_ATTRIBUTION_DATA,
  ACTION_SET_PROJECT_CONFIG,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  type ResetResourceStateAction,
  type SetAttributionBreakpoints,
  type SetFilesWithChildren,
  type SetIsPackageInfoDirtyAction,
  type SetManualDataAction,
  type SetProjectConfigAction,
  type SetProjectMetadata,
  type SetTemporaryDisplayPackageInfoAction,
} from './types';

export function resetResourceState(): ResetResourceStateAction {
  return { type: ACTION_RESET_RESOURCE_STATE };
}

export function setConfig(config: ProjectConfig): SetProjectConfigAction {
  return { type: ACTION_SET_PROJECT_CONFIG, payload: config };
}

export function setManualData(
  attributions: Attributions,
  resourcesToAttributions: ResourcesToAttributions,
  attributionsToResources: AttributionsToResources,
): SetManualDataAction {
  return {
    type: ACTION_SET_MANUAL_ATTRIBUTION_DATA,
    payload: {
      attributions,
      resourcesToAttributions,
      attributionsToResources,
      resourcesWithAttributedChildren: computeChildrenWithAttributions(
        attributionsToResources,
      ),
    },
  };
}

export function setTemporaryDisplayPackageInfo(
  packageInfo: PackageInfo,
): SetTemporaryDisplayPackageInfoAction {
  return { type: ACTION_SET_TEMPORARY_PACKAGE_INFO, payload: packageInfo };
}

export function setAttributionBreakpoints(
  attributionBreakpoints: Set<string>,
): SetAttributionBreakpoints {
  return {
    type: ACTION_SET_ATTRIBUTION_BREAKPOINTS,
    payload: attributionBreakpoints,
  };
}

export function setFilesWithChildren(
  filesWithChildren: Set<string>,
): SetFilesWithChildren {
  return {
    type: ACTION_SET_FILES_WITH_CHILDREN,
    payload: filesWithChildren,
  };
}

export function setProjectMetadata(
  metadata: ProjectMetadata,
): SetProjectMetadata {
  return {
    type: ACTION_SET_PROJECT_METADATA,
    payload: metadata,
  };
}

export function setIsPackageInfoDirty(
  isDirty: boolean,
): SetIsPackageInfoDirtyAction {
  return {
    type: ACTION_SET_IS_PACKAGE_INFO_DIRTY,
    payload: isDirty,
  };
}
