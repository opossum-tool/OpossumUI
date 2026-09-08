// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PackageInfo, Relation } from '../../../../shared/shared-types';
import type { AttributionFilters } from '../../variables/use-filters';

export const ACTION_SET_SELECTED_ATTRIBUTION_ID =
  'ACTION_SET_SELECTED_ATTRIBUTION_ID';
export const ACTION_RESET_RESOURCE_STATE = 'ACTION_RESET_RESOURCE_STATE';
export const ACTION_SET_TEMPORARY_PACKAGE_INFO =
  'ACTION_SET_TEMPORARY_PACKAGE_INFO';
export const ACTION_INITIALIZE_PACKAGE_INFO_EDITING =
  'ACTION_INITIALIZE_PACKAGE_INFO_EDITING';
export const ACTION_SET_SELECTED_RESOURCE_ID =
  'ACTION_SET_SELECTED_RESOURCE_ID';
export const ACTION_SET_EXPANDED_IDS = 'ACTION_SET_EXPANDED_IDS';
export const ACTION_SET_TARGET_SELECTED_RESOURCE_ID =
  'ACTION_SET_TARGET_SELECTED_RESOURCE_ID';
export const ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID =
  'ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID';
export const ACTION_SET_TARGET_ATTRIBUTION_FILTER_CHANGE =
  'ACTION_SET_TARGET_ATTRIBUTION_FILTER_CHANGE';
export const ACTION_SET_TARGET_ATTRIBUTION_RELATION =
  'ACTION_SET_TARGET_ATTRIBUTION_RELATION';
export const ACTION_SET_PENDING_ATTRIBUTION_NAVIGATION =
  'ACTION_SET_PENDING_ATTRIBUTION_NAVIGATION';
export const ACTION_SET_ATTRIBUTION_SELECTION_PENDING =
  'ACTION_SET_ATTRIBUTION_SELECTION_PENDING';
export const ACTION_COMPLETE_ATTRIBUTION_SELECTION =
  'ACTION_COMPLETE_ATTRIBUTION_SELECTION';

export interface PendingAttributionNavigation {
  attributionUuid: string;
  fallbackResourcePath: string;
}

export type ResourceAction =
  | ResetResourceStateAction
  | SetTemporaryDisplayPackageInfoAction
  | InitializePackageInfoEditingAction
  | SetSelectedResourceIdAction
  | SetExpandedIdsAction
  | SetTargetSelectedResourceId
  | SetSelectedAttributionId
  | SetTargetSelectedAttributionIdAction
  | SetTargetAttributionFilterChangeAction
  | SetTargetAttributionRelationAction
  | SetPendingAttributionNavigationAction
  | SetAttributionSelectionPendingAction
  | CompleteAttributionSelectionAction;

export interface ResetResourceStateAction {
  type: typeof ACTION_RESET_RESOURCE_STATE;
}

export interface SetTemporaryDisplayPackageInfoAction {
  type: typeof ACTION_SET_TEMPORARY_PACKAGE_INFO;
  payload: PackageInfo;
}

export interface InitializePackageInfoEditingAction {
  type: typeof ACTION_INITIALIZE_PACKAGE_INFO_EDITING;
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

export interface SetAttributionSelectionPendingAction {
  type: typeof ACTION_SET_ATTRIBUTION_SELECTION_PENDING;
  payload: string | null;
}

export interface CompleteAttributionSelectionAction {
  type: typeof ACTION_COMPLETE_ATTRIBUTION_SELECTION;
  payload: string;
}

export interface SetTargetSelectedAttributionIdAction {
  type: typeof ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID;
  payload: string | null;
}

export interface TargetAttributionFilterChange {
  discardedPackageInfo: PackageInfo;
  external: boolean;
  filters: AttributionFilters;
}

export interface SetTargetAttributionFilterChangeAction {
  type: typeof ACTION_SET_TARGET_ATTRIBUTION_FILTER_CHANGE;
  payload: TargetAttributionFilterChange | null;
}

export interface SetTargetAttributionRelationAction {
  type: typeof ACTION_SET_TARGET_ATTRIBUTION_RELATION;
  payload: Relation | null;
}

export interface SetPendingAttributionNavigationAction {
  type: typeof ACTION_SET_PENDING_ATTRIBUTION_NAVIGATION;
  payload: PendingAttributionNavigation | null;
}
