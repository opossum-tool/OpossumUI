// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  ExternalAttributionSources,
  FrequentLicenses,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { computeChildrenWithAttributions } from '../../helpers/action-and-reducer-helpers';
import {
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_ATTRIBUTION_BREAKPOINTS,
  ACTION_SET_BASE_URLS_FOR_SOURCES,
  ACTION_SET_ENABLE_PREFERENCE_FEATURE,
  ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
  ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES,
  ACTION_SET_FILES_WITH_CHILDREN,
  ACTION_SET_FREQUENT_LICENSES,
  ACTION_SET_MANUAL_ATTRIBUTION_DATA,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_RESOURCES,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  ResetResourceStateAction,
  SetAttributionBreakpoints,
  SetBaseUrlsForSources,
  SetExternalAttributionSources,
  SetExternalDataAction,
  SetFilesWithChildren,
  SetFrequentLicensesAction,
  SetIsPreferenceFeatureEnabled,
  SetManualDataAction,
  SetProjectMetadata,
  SetResourcesAction,
  SetTemporaryDisplayPackageInfoAction,
} from './types';

export function resetResourceState(): ResetResourceStateAction {
  return { type: ACTION_RESET_RESOURCE_STATE };
}

export function setResources(resources: Resources | null): SetResourcesAction {
  return { type: ACTION_SET_RESOURCES, payload: resources };
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

export function setExternalData(
  attributions: Attributions,
  resourcesToAttributions: ResourcesToAttributions,
  attributionsToResources: AttributionsToResources,
  resolvedAttributions: Set<string>,
): SetExternalDataAction {
  return {
    type: ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
    payload: {
      attributions,
      resourcesToAttributions,
      attributionsToResources,
      resourcesWithAttributedChildren: computeChildrenWithAttributions(
        attributionsToResources,
        resolvedAttributions,
      ),
    },
  };
}

export function setFrequentLicenses(
  licenses: FrequentLicenses,
): SetFrequentLicensesAction {
  return { type: ACTION_SET_FREQUENT_LICENSES, payload: licenses };
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

export function setBaseUrlsForSources(
  baseUrlsForSources: BaseUrlsForSources,
): SetBaseUrlsForSources {
  return {
    type: ACTION_SET_BASE_URLS_FOR_SOURCES,
    payload: baseUrlsForSources,
  };
}

export function setExternalAttributionSources(
  externalAttributionSources: ExternalAttributionSources,
): SetExternalAttributionSources {
  return {
    type: ACTION_SET_EXTERNAL_ATTRIBUTION_SOURCES,
    payload: externalAttributionSources,
  };
}

export function setIsPreferenceFeatureEnabled(
  isPreferenceFeatureEnabled: boolean,
): SetIsPreferenceFeatureEnabled {
  return {
    type: ACTION_SET_ENABLE_PREFERENCE_FEATURE,
    payload: isPreferenceFeatureEnabled,
  };
}
