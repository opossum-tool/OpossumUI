// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PackageInfo, Relation } from '../../../shared/shared-types';
import { EMPTY_DISPLAY_PACKAGE_INFO, ROOT_PATH } from '../../shared-constants';
import {
  ACTION_COMPLETE_ATTRIBUTION_SELECTION,
  ACTION_INITIALIZE_PACKAGE_INFO_EDITING,
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_ATTRIBUTION_SELECTION_PENDING,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_PENDING_ATTRIBUTION_NAVIGATION,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_ATTRIBUTION_FILTER_CHANGE,
  ACTION_SET_TARGET_ATTRIBUTION_RELATION,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  type PendingAttributionNavigation,
  type ResourceAction,
  type TargetAttributionFilterChange,
} from '../actions/resource-actions/types';

export const initialResourceState: ResourceState = {
  expandedIds: [ROOT_PATH],
  originalDisplayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
  selectedAttributionId: '',
  selectedResourceId: ROOT_PATH,
  targetSelectedAttributionId: null,
  targetAttributionFilterChange: null,
  targetAttributionRelation: null,
  pendingAttributionNavigation: null,
  targetSelectedResourceId: null,
  attributionSelectionPendingResourceId: null,
  temporaryDisplayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
};

export type ResourceState = {
  expandedIds: Array<string>;
  originalDisplayPackageInfo: PackageInfo;
  selectedAttributionId: string;
  selectedResourceId: string;
  targetSelectedAttributionId: string | null;
  targetAttributionFilterChange: TargetAttributionFilterChange | null;
  targetAttributionRelation: Relation | null;
  pendingAttributionNavigation: PendingAttributionNavigation | null;
  targetSelectedResourceId: string | null;
  attributionSelectionPendingResourceId: string | null;
  temporaryDisplayPackageInfo: PackageInfo;
};

export const resourceState = (
  state: ResourceState = initialResourceState,
  action: ResourceAction,
): ResourceState => {
  switch (action.type) {
    case ACTION_RESET_RESOURCE_STATE:
      return initialResourceState;
    case ACTION_SET_TEMPORARY_PACKAGE_INFO:
      return {
        ...state,
        temporaryDisplayPackageInfo: action.payload,
      };
    case ACTION_INITIALIZE_PACKAGE_INFO_EDITING:
      return {
        ...state,
        originalDisplayPackageInfo: action.payload,
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
    case ACTION_SET_ATTRIBUTION_SELECTION_PENDING:
      return {
        ...state,
        attributionSelectionPendingResourceId: action.payload,
      };
    case ACTION_COMPLETE_ATTRIBUTION_SELECTION:
      return action.payload === state.attributionSelectionPendingResourceId
        ? { ...state, attributionSelectionPendingResourceId: null }
        : state;
    case ACTION_SET_EXPANDED_IDS:
      return {
        ...state,
        expandedIds: action.payload,
      };
    case ACTION_SET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        selectedAttributionId: action.payload,
        pendingAttributionNavigation:
          state.pendingAttributionNavigation?.attributionUuid === action.payload
            ? state.pendingAttributionNavigation
            : null,
      };
    case ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID:
      return {
        ...state,
        targetSelectedAttributionId: action.payload,
      };
    case ACTION_SET_TARGET_ATTRIBUTION_FILTER_CHANGE:
      return {
        ...state,
        targetAttributionFilterChange: action.payload,
      };
    case ACTION_SET_TARGET_ATTRIBUTION_RELATION:
      return {
        ...state,
        targetAttributionRelation: action.payload,
      };
    case ACTION_SET_PENDING_ATTRIBUTION_NAVIGATION:
      return {
        ...state,
        pendingAttributionNavigation: action.payload,
      };
    default:
      return state;
  }
};
