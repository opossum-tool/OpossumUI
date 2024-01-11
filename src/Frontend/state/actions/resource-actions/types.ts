// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  BaseUrlsForSources,
  DisplayPackageInfo,
  ExternalAttributionSources,
  FrequentLicenses,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { AllowedSaveOperations } from '../../../enums/enums';
import { LocatePopupFilters, PanelPackage } from '../../../types/types';

export const ACTION_SET_SELECTED_ATTRIBUTION_ID =
  'ACTION_SET_SELECTED_ATTRIBUTION_ID';
export const ACTION_RESET_RESOURCE_STATE = 'ACTION_RESET_RESOURCE_STATE';
export const ACTION_SET_RESOURCES = 'ACTION_SET_RESOURCES';
export const ACTION_SET_MANUAL_ATTRIBUTION_DATA =
  'ACTION_SET_MANUAL_ATTRIBUTION_DATA';
export const ACTION_SET_EXTERNAL_ATTRIBUTION_DATA =
  'ACTION_SET_EXTERNAL_ATTRIBUTION_DATA';
export const ACTION_SET_FREQUENT_LICENSES = 'ACTION_SET_FREQUENT_LICENSES';
export const ACTION_SET_TEMPORARY_PACKAGE_INFO =
  'ACTION_SET_TEMPORARY_PACKAGE_INFO';
export const ACTION_SET_SELECTED_RESOURCE_ID =
  'ACTION_SET_SELECTED_RESOURCE_ID';
export const ACTION_SET_EXPANDED_IDS = 'ACTION_SET_EXPANDED_IDS';
export const ACTION_SET_TARGET_SELECTED_RESOURCE_ID =
  'ACTION_SET_TARGET_SELECTED_RESOURCE_ID';
export const ACTION_SET_ALLOWED_SAVE_OPERATIONS =
  'ACTION_SET_ALLOWED_SAVE_OPERATIONS';
export const ACTION_SET_ATTRIBUTION_BREAKPOINTS =
  'ACTION_SET_ATTRIBUTION_BREAKPOINTS';
export const ACTION_SET_FILES_WITH_CHILDREN = 'ACTION_SET_FILES_WITH_CHILDREN';
export const ACTION_UPDATE_ATTRIBUTION =
  'ACTION_UPDATE_ATTRIBUTION_FOR_SELECTED';
export const ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE =
  'ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE';
export const ACTION_DELETE_ATTRIBUTION =
  'ACTION_DELETE_ATTRIBUTION_FOR_SELECTED';
export const ACTION_SET_DISPLAYED_PANEL_PACKAGE =
  'ACTION_SET_DISPLAYED_PANEL_PACKAGE';
export const ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE =
  'ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE';
export const ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID =
  'ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID';
export const ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS =
  'ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS';
export const ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION =
  'ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION';
export const ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING =
  'ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING';
export const ACTION_LINK_TO_ATTRIBUTION = 'ACTION_LINK_TO_ATTRIBUTION';
export const ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION =
  'ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION';
export const ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION =
  'ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION';
export const ACTION_SET_FILE_SEARCH = 'ACTION_SET_FILE_SEARCH';
export const ACTION_SET_PROJECT_METADATA = 'ACTION_SET_PROJECT_METADATA';
export const ACTION_SET_BASE_URLS_FOR_SOURCES =
  'ACTION_SET_BASE_URLS_FOR_SOURCES';
export const ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES =
  'ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES';
export const ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS =
  'ACTION_SET_ATTRIBUTION_IDS_MARKED_FOR_MULTISELECT';
export const ACTION_TOGGLE_ACCORDION_SEARCH_FIELD =
  'ACTION_TOGGLE_ACCORDION_SEARCH_FIELD';
export const ACTION_SET_PACKAGE_SEARCH_TERM = 'ACTION_SET_PACKAGE_SEARCH_TERM';
export const ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES =
  'ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES';
export const ACTION_SET_RESOURCES_WITH_LOCATED_ATTRIBUTIONS =
  'ACTION_SET_RESOURCES_WITH_LOCATED_ATTRIBUTIONS';
export const ACTION_SET_ENABLE_PREFERENCE_FEATURE =
  'ACTION_SET_ENABLE_PREFERENCE_FEATURE';
export const ACTION_SET_LOCATE_POPUP_FILTERS =
  'ACTION_SET_LOCATE_POPUP_FILTERS';

export type ResourceAction =
  | ResetResourceStateAction
  | SetResourcesAction
  | SetManualDataAction
  | SetExternalDataAction
  | SetFrequentLicensesAction
  | SetTemporaryDisplayPackageInfoAction
  | SetSelectedResourceIdAction
  | SetExpandedIdsAction
  | SetTargetSelectedResourceId
  | SetSelectedAttributionId
  | SetAllowedSaveOperation
  | SetAttributionBreakpoints
  | SetFilesWithChildren
  | UpdateAttribution
  | DeleteAttribution
  | CreateAttributionForSelectedResource
  | SetDisplayedPanelPackageAction
  | SetTargetDisplayedPanelPackageAction
  | SetTargetSelectedAttributionIdAction
  | ReplaceAttributionWithMatchingAttributionAction
  | LinkToAttributionAction
  | UnlinkResourceFromAttributionAction
  | SetResolvedExternalAttributions
  | AddResolvedExternalAttribution
  | RemoveResolvedExternalAttribution
  | SetProjectMetadata
  | SetFileSearch
  | SetBaseUrlsForSources
  | SetExternalAttributionSources
  | SetMultiSelectSelectedAttributionIds
  | ToggleAccordionSearchField
  | SetPackageSearchTerm
  | SetExternalAttributionsToHashes
  | SetIsPreferenceFeatureEnabled
  | SetLocatePopupFilters;

export interface ResetResourceStateAction {
  type: typeof ACTION_RESET_RESOURCE_STATE;
}

export interface SetResourcesAction {
  type: typeof ACTION_SET_RESOURCES;
  payload: Resources | null;
}

export interface SetManualDataAction {
  type: typeof ACTION_SET_MANUAL_ATTRIBUTION_DATA;
  payload: AttributionData;
}

export interface SetExternalDataAction {
  type: typeof ACTION_SET_EXTERNAL_ATTRIBUTION_DATA;
  payload: AttributionData;
}

export interface SetFrequentLicensesAction {
  type: typeof ACTION_SET_FREQUENT_LICENSES;
  payload: FrequentLicenses;
}

export interface SetProgressBarDataPayload {
  resources: Resources;
  manualAttributions: Attributions;
  resourcesToManualAttributions: ResourcesToAttributions;
  resourcesToExternalAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
}

export interface SetTemporaryDisplayPackageInfoAction {
  type: typeof ACTION_SET_TEMPORARY_PACKAGE_INFO;
  payload: DisplayPackageInfo;
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

export interface SetDisplayedPanelPackageAction {
  type: typeof ACTION_SET_DISPLAYED_PANEL_PACKAGE;
  payload: PanelPackage | null;
}

export interface SetTargetDisplayedPanelPackageAction {
  type: typeof ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE;
  payload: PanelPackage | null;
}
export interface SetSelectedAttributionId {
  type: typeof ACTION_SET_SELECTED_ATTRIBUTION_ID;
  payload: string;
}

export interface SetTargetSelectedAttributionIdAction {
  type: typeof ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID;
  payload: string | null;
}

export interface SetAllowedSaveOperation {
  type: typeof ACTION_SET_ALLOWED_SAVE_OPERATIONS;
  payload: AllowedSaveOperations;
}

export interface SetAttributionBreakpoints {
  type: typeof ACTION_SET_ATTRIBUTION_BREAKPOINTS;
  payload: Set<string>;
}

export interface SetFilesWithChildren {
  type: typeof ACTION_SET_FILES_WITH_CHILDREN;
  payload: Set<string>;
}

export interface CreateAttributionForSelectedResource {
  type: typeof ACTION_CREATE_ATTRIBUTION_FOR_SELECTED_RESOURCE;
  payload: {
    strippedPackageInfo: PackageInfo;
    jumpToCreatedAttribution: boolean;
  };
}

export interface UpdateAttribution {
  type: typeof ACTION_UPDATE_ATTRIBUTION;
  payload: {
    attributionId: string;
    strippedPackageInfo: PackageInfo;
    jumpToUpdatedAttribution: boolean;
  };
}

export interface DeleteAttribution {
  type: typeof ACTION_DELETE_ATTRIBUTION;
  payload: string;
}

export interface ReplaceAttributionWithMatchingAttributionAction {
  type: typeof ACTION_REPLACE_ATTRIBUTION_WITH_MATCHING;
  payload: {
    attributionId: string;
    strippedPackageInfo: PackageInfo;
    jumpToMatchingAttribution: boolean;
  };
}

export interface LinkToAttributionAction {
  type: typeof ACTION_LINK_TO_ATTRIBUTION;
  payload: {
    resourceId: string;
    strippedPackageInfo: PackageInfo;
  };
}

export interface UnlinkResourceFromAttributionAction {
  type: typeof ACTION_UNLINK_RESOURCE_FROM_ATTRIBUTION;
  payload: { resourceId: string; attributionId: string };
}

export interface SetResolvedExternalAttributions {
  type: typeof ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS;
  payload: Set<string>;
}

export interface AddResolvedExternalAttribution {
  type: typeof ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION;
  payload: string;
}

export interface RemoveResolvedExternalAttribution {
  type: typeof ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION;
  payload: string;
}

export interface SetFileSearch {
  type: typeof ACTION_SET_FILE_SEARCH;
  payload: string;
}

export interface SetProjectMetadata {
  type: typeof ACTION_SET_PROJECT_METADATA;
  payload: ProjectMetadata;
}

export interface SetBaseUrlsForSources {
  type: typeof ACTION_SET_BASE_URLS_FOR_SOURCES;
  payload: BaseUrlsForSources;
}

export interface SetExternalAttributionSources {
  type: typeof ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES;
  payload: ExternalAttributionSources;
}

export interface SetMultiSelectSelectedAttributionIds {
  type: typeof ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS;
  payload: Array<string>;
}

export interface ToggleAccordionSearchField {
  type: typeof ACTION_TOGGLE_ACCORDION_SEARCH_FIELD;
}

export interface SetPackageSearchTerm {
  type: typeof ACTION_SET_PACKAGE_SEARCH_TERM;
  payload: string;
}

export interface SetExternalAttributionsToHashes {
  type: typeof ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES;
  payload: AttributionsToHashes;
}

export interface SetIsPreferenceFeatureEnabled {
  type: typeof ACTION_SET_ENABLE_PREFERENCE_FEATURE;
  payload: boolean;
}

export interface SetLocatePopupFilters {
  type: typeof ACTION_SET_LOCATE_POPUP_FILTERS;
  payload: LocatePopupFilters;
}
