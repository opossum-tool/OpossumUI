// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type BaseUrlsForSources,
  type PackageInfo,
  type ProjectConfig,
  type ProjectMetadata,
} from '../../../../shared/shared-types';

export const ACTION_SET_SELECTED_ATTRIBUTION_ID =
  'ACTION_SET_SELECTED_ATTRIBUTION_ID';
export const ACTION_RESET_RESOURCE_STATE = 'ACTION_RESET_RESOURCE_STATE';
export const ACTION_SET_PROJECT_CONFIG = 'ACTION_SET_PROJECT_CONFIG';
export const ACTION_SET_TEMPORARY_PACKAGE_INFO =
  'ACTION_SET_TEMPORARY_PACKAGE_INFO';
export const ACTION_SET_SELECTED_RESOURCE_ID =
  'ACTION_SET_SELECTED_RESOURCE_ID';
export const ACTION_SET_EXPANDED_IDS = 'ACTION_SET_EXPANDED_IDS';
export const ACTION_SET_TARGET_SELECTED_RESOURCE_ID =
  'ACTION_SET_TARGET_SELECTED_RESOURCE_ID';
export const ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID =
  'ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID';
export const ACTION_SET_PROJECT_METADATA = 'ACTION_SET_PROJECT_METADATA';
export const ACTION_SET_BASE_URLS_FOR_SOURCES =
  'ACTION_SET_BASE_URLS_FOR_SOURCES';
export const ACTION_SET_IS_PACKAGE_INFO_DIRTY =
  'ACTION_SET_IS_PACKAGE_INFO_DIRTY';

export type ResourceAction =
  | ResetResourceStateAction
  | SetProjectConfigAction
  | SetTemporaryDisplayPackageInfoAction
  | SetSelectedResourceIdAction
  | SetExpandedIdsAction
  | SetTargetSelectedResourceId
  | SetSelectedAttributionId
  | SetTargetSelectedAttributionIdAction
  | SetProjectMetadata
  | SetBaseUrlsForSources
  | SetIsPackageInfoDirtyAction;

export interface ResetResourceStateAction {
  type: typeof ACTION_RESET_RESOURCE_STATE;
}

export interface SetProjectConfigAction {
  type: typeof ACTION_SET_PROJECT_CONFIG;
  payload: ProjectConfig;
}

export interface SetTemporaryDisplayPackageInfoAction {
  type: typeof ACTION_SET_TEMPORARY_PACKAGE_INFO;
  payload: PackageInfo;
}

export interface SetSelectedResourceIdAction {
  type: typeof ACTION_SET_SELECTED_RESOURCE_ID;
  payload: string;
}

export interface SetTargetSelectedResourceId {
  type: typeof ACTION_SET_TARGET_SELECTED_RESOURCE_ID;
  payload: string | null;
}

export interface SetExpandedIdsAction {
  type: typeof ACTION_SET_EXPANDED_IDS;
  payload: Array<string>;
}

export interface SetSelectedAttributionId {
  type: typeof ACTION_SET_SELECTED_ATTRIBUTION_ID;
  payload: string;
}

export interface SetTargetSelectedAttributionIdAction {
  type: typeof ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID;
  payload: string | null;
}

export interface SetProjectMetadata {
  type: typeof ACTION_SET_PROJECT_METADATA;
  payload: ProjectMetadata;
}

export interface SetBaseUrlsForSources {
  type: typeof ACTION_SET_BASE_URLS_FOR_SOURCES;
  payload: BaseUrlsForSources;
}

export interface SetIsPackageInfoDirtyAction {
  type: typeof ACTION_SET_IS_PACKAGE_INFO_DIRTY;
  payload: boolean;
}
