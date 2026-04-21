// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type PackageInfo,
  type ProjectConfig,
  type ProjectMetadata,
} from '../../../shared/shared-types';
import {
  EMPTY_DISPLAY_PACKAGE_INFO,
  EMPTY_PROJECT_CONFIG,
  EMPTY_PROJECT_METADATA,
  ROOT_PATH,
} from '../../shared-constants';
import {
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_IS_PACKAGE_INFO_DIRTY,
  ACTION_SET_PROJECT_CONFIG,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  type ResourceAction,
} from '../actions/resource-actions/types';

export const initialResourceState: ResourceState = {
  expandedIds: [ROOT_PATH],
  isPackageInfoDirty: false,
  metadata: EMPTY_PROJECT_METADATA,
  config: EMPTY_PROJECT_CONFIG,
  selectedAttributionId: '',
  selectedResourceId: ROOT_PATH,
  targetSelectedAttributionId: null,
  targetSelectedResourceId: null,
  temporaryDisplayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
};

export type ResourceState = {
  expandedIds: Array<string>;
  isPackageInfoDirty: boolean;
  metadata: ProjectMetadata;
  config: ProjectConfig;
  selectedAttributionId: string;
  selectedResourceId: string;
  targetSelectedAttributionId: string | null;
  targetSelectedResourceId: string | null;
  temporaryDisplayPackageInfo: PackageInfo;
};

export const resourceState = (
  state: ResourceState = initialResourceState,
  action: ResourceAction,
): ResourceState => {
  switch (action.type) {
    case ACTION_RESET_RESOURCE_STATE:
      return initialResourceState;
    case ACTION_SET_PROJECT_CONFIG:
      return {
        ...state,
        config: action.payload,
      };
    case ACTION_SET_TEMPORARY_PACKAGE_INFO:
      return {
        ...state,
        temporaryDisplayPackageInfo: action.payload,
      };
    case ACTION_SET_SELECTED_RESOURCE_ID:
      return {
        ...state,
        selectedResourceId: action.payload,
      };
    case ACTION_SET_TARGET_SELECTED_RESOURCE_ID:
      return {
        ...state,
        targetSelectedResourceId: action.payload,
      };
    case ACTION_SET_EXPANDED_IDS:
      return {
        ...state,
        expandedIds: action.payload,
      };
    case ACTION_SET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        selectedAttributionId: action.payload,
      };
    case ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        targetSelectedAttributionId: action.payload,
      };
    case ACTION_SET_PROJECT_METADATA:
      return {
        ...state,
        metadata: action.payload,
      };
    case ACTION_SET_IS_PACKAGE_INFO_DIRTY:
      return {
        ...state,
        isPackageInfoDirty: action.payload,
      };
    default:
      return state;
  }
};
