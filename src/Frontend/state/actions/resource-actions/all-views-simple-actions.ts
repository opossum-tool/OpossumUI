// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  FrequentLicences,
  PackageInfo,
  BaseUrlsForSources,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { getAttributionDataFromSetAttributionDataPayload } from '../../helpers/action-and-reducer-helpers';
import {
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_ATTRIBUTION_BREAKPOINTS,
  ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
  ACTION_SET_FILES_WITH_CHILDREN,
  ACTION_SET_FREQUENT_LICENSES,
  ACTION_SET_MANUAL_ATTRIBUTION_DATA,
  ACTION_SET_BASE_URLS_FOR_SOURCES,
  ACTION_SET_PROGRESS_BAR_DATA,
  ACTION_SET_PROJECT_METADATA,
  ACTION_SET_RESOURCES,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  ResetResourceStateAction,
  SetAttributionBreakpoints,
  SetExternalDataAction,
  SetFilesWithChildren,
  SetFrequentLicencesAction,
  SetManualDataAction,
  SetBaseUrlsForSources,
  SetProgressBarData,
  SetProjectMetadata,
  SetResourcesAction,
  SetTemporaryPackageInfoAction,
} from './types';

export function resetResourceState(): ResetResourceStateAction {
  return { type: ACTION_RESET_RESOURCE_STATE };
}

export function setResources(resources: Resources | null): SetResourcesAction {
  return { type: ACTION_SET_RESOURCES, payload: resources };
}

export function setManualData(
  attributions: Attributions,
  resourcesToAttributions: ResourcesToAttributions
): SetManualDataAction {
  return {
    type: ACTION_SET_MANUAL_ATTRIBUTION_DATA,
    payload: getAttributionDataFromSetAttributionDataPayload({
      attributions,
      resourcesToAttributions,
    }),
  };
}

export function setExternalData(
  attributions: Attributions,
  resourcesToAttributions: ResourcesToAttributions
): SetExternalDataAction {
  return {
    type: ACTION_SET_EXTERNAL_ATTRIBUTION_DATA,
    payload: getAttributionDataFromSetAttributionDataPayload({
      attributions,
      resourcesToAttributions,
    }),
  };
}

export function setFrequentLicences(
  licenses: FrequentLicences
): SetFrequentLicencesAction {
  return { type: ACTION_SET_FREQUENT_LICENSES, payload: licenses };
}

export function setProgressBarData(
  resources: Resources,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resolvedExternalAttributions: Set<string>
): SetProgressBarData {
  return {
    type: ACTION_SET_PROGRESS_BAR_DATA,
    payload: {
      resources,
      manualAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
    },
  };
}

export function setTemporaryPackageInfo(
  packageInfo: PackageInfo
): SetTemporaryPackageInfoAction {
  return { type: ACTION_SET_TEMPORARY_PACKAGE_INFO, payload: packageInfo };
}

export function setAttributionBreakpoints(
  attributionBreakpoints: Set<string>
): SetAttributionBreakpoints {
  return {
    type: ACTION_SET_ATTRIBUTION_BREAKPOINTS,
    payload: attributionBreakpoints,
  };
}

export function setFilesWithChildren(
  filesWithChildren: Set<string>
): SetFilesWithChildren {
  return {
    type: ACTION_SET_FILES_WITH_CHILDREN,
    payload: filesWithChildren,
  };
}

export function setProjectMetadata(
  metadata: ProjectMetadata
): SetProjectMetadata {
  return {
    type: ACTION_SET_PROJECT_METADATA,
    payload: metadata,
  };
}

export function setBaseUrlsForSources(
  baseUrlsForSources: BaseUrlsForSources
): SetBaseUrlsForSources {
  return {
    type: ACTION_SET_BASE_URLS_FOR_SOURCES,
    payload: baseUrlsForSources,
  };
}
