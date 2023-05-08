// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  BaseUrlsForSources,
  ExternalAttributionSources,
  FrequentLicenses,
  PackageInfo,
  DisplayPackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  PanelPackage,
  PackageAttributeIds,
  PackageAttributes,
} from '../../../types/types';

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
export const ACTION_SET_IS_SAVING_DISABLED = 'ACTION_SET_IS_SAVING_DISABLED';
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
export const ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT =
  'ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT';
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
export const ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION =
  'ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION';
export const ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES =
  'ACTION_SET_ATTRIBUTION_WIZARD_INITIAL_PACKAGE_NAMESPACES';
export const ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES =
  'ACTION_SET_ATTRIBUTION_WIZARD_INITIAL_PACKAGE_NAMES';
export const ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS =
  'ACTION_SET_ATTRIBUTION_WIZARD_INITIAL_PACKAGE_VERSIONS';
export const ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS =
  'ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS';
export const ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT =
  'ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT';
export const ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES =
  'ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES';

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
  | SetIsSavingDisabled
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
  | SetAttributionIdMarkedForReplacement
  | SetExternalAttributionSources
  | SetMultiSelectSelectedAttributionIds
  | ToggleAccordionSearchField
  | SetPackageSearchTerm
  | SetAttributionWizardOriginalAttribution
  | SetAttributionWizardPackageNamespaces
  | SetAttributionWizardPackageNames
  | SetAttributionWizardPackageVersions
  | SetAttributionWizardSelectedPackageIds
  | SetAttributionWizardTotalAttributionCount
  | SetExternalAttributionsToHashes;

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

export interface SetIsSavingDisabled {
  type: typeof ACTION_SET_IS_SAVING_DISABLED;
  payload: boolean;
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

export interface SetAttributionIdMarkedForReplacement {
  type: typeof ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT;
  payload: string;
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

export interface SetAttributionWizardOriginalAttribution {
  type: typeof ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION;
  payload: DisplayPackageInfo;
}
export interface SetAttributionWizardPackageNamespaces {
  type: typeof ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES;
  payload: PackageAttributes;
}

export interface SetAttributionWizardPackageNames {
  type: typeof ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES;
  payload: PackageAttributes;
}

export interface SetAttributionWizardPackageVersions {
  type: typeof ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS;
  payload: PackageAttributes;
}

export interface SetAttributionWizardSelectedPackageIds {
  type: typeof ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS;
  payload: PackageAttributeIds;
}

export interface SetAttributionWizardTotalAttributionCount {
  type: typeof ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT;
  payload: number | null;
}

export interface SetExternalAttributionsToHashes {
  type: typeof ACTION_SET_EXTERNAL_ATTRIBUTIONS_TO_HASHES;
  payload: AttributionsToHashes;
}
