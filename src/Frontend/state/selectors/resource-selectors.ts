// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual } from 'lodash';

import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  ExternalAttributionSources,
  FrequentLicenseName,
  LicenseTexts,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { State } from '../../types/types';
import { getStrippedPackageInfo } from '../../util/get-stripped-package-info';

export function getResources(state: State): Resources | null {
  return state.resourceState.resources;
}

export function getResourceIds(state: State): Array<string> | null {
  return state.resourceState.resourceIds;
}

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

export function getResolvedExternalAttributions(state: State): Set<string> {
  return state.resourceState.resolvedExternalAttributions;
}

export function getUnresolvedExternalAttributions(state: State): Attributions {
  return Object.fromEntries(
    Object.entries(state.resourceState.externalData.attributions).filter(
      ([attributionId]) =>
        !state.resourceState.resolvedExternalAttributions.has(attributionId),
    ),
  );
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

export function getResourcesToManualAttributions(
  state: State,
): ResourcesToAttributions {
  return state.resourceState.manualData.resourcesToAttributions;
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

export function getExternalData(state: State): AttributionData {
  return state.resourceState.externalData;
}

export function getExternalAttributions(state: State): Attributions {
  return state.resourceState.externalData.attributions;
}

export function getResourcesToExternalAttributions(
  state: State,
): ResourcesToAttributions {
  return state.resourceState.externalData.resourcesToAttributions;
}

export function getExternalAttributionsToResources(
  state: State,
): AttributionsToResources {
  return state.resourceState.externalData.attributionsToResources;
}

export function getResourcesWithExternalAttributedChildren(
  state: State,
): ResourcesWithAttributedChildren {
  return state.resourceState.externalData.resourcesWithAttributedChildren;
}

export function getFrequentLicensesNameOrder(
  state: State,
): Array<FrequentLicenseName> {
  return state.resourceState.frequentLicenses.nameOrder;
}

export function getFrequentLicensesTexts(state: State): LicenseTexts {
  return state.resourceState.frequentLicenses.texts;
}

export function getTemporaryDisplayPackageInfo(state: State): PackageInfo {
  return state.resourceState.temporaryDisplayPackageInfo;
}

export function getAttributionBreakpoints(state: State): Set<string> {
  return state.resourceState.attributionBreakpoints;
}

export function getFilesWithChildren(state: State): Set<string> {
  return state.resourceState.filesWithChildren;
}

export function getProjectMetadata(state: State): ProjectMetadata {
  return state.resourceState.metadata;
}

export function getPackageInfoOfSelectedAttribution(
  state: State,
): PackageInfo | null {
  const selectedAttributionId = getSelectedAttributionId(state);

  if (!selectedAttributionId) {
    return null;
  }
  const attributions = getManualAttributions(state);
  const signals = getExternalAttributions(state);

  return (
    attributions[selectedAttributionId] ||
    signals[selectedAttributionId] ||
    null
  );
}

export function getIsPackageInfoModified(state: State): boolean {
  const temporaryDisplayPackageInfo = getTemporaryDisplayPackageInfo(state);
  const displayPackageInfoOfSelected =
    getPackageInfoOfSelectedAttribution(state) || EMPTY_DISPLAY_PACKAGE_INFO;

  return !isEqual(
    getStrippedPackageInfo(temporaryDisplayPackageInfo),
    getStrippedPackageInfo(displayPackageInfoOfSelected),
  );
}

export function getBaseUrlsForSources(state: State): BaseUrlsForSources {
  return state.resourceState.baseUrlsForSources;
}

export function getExternalAttributionSources(
  state: State,
): ExternalAttributionSources {
  return state.resourceState.externalAttributionSources;
}

export function getIsPreferenceFeatureEnabled(state: State): boolean {
  return state.resourceState.isPreferenceFeatureEnabled;
}

export function getResourceIdsOfSelectedAttribution(
  state: State,
): Array<string> {
  const resolvedExternalAttributions = getResolvedExternalAttributions(state);
  const attributionId = getSelectedAttributionId(state);
  const manualAttributionsToResources = getManualAttributionsToResources(state);
  const externalAttributionsToResources =
    getExternalAttributionsToResources(state);

  return (
    (attributionId &&
      !resolvedExternalAttributions.has(attributionId) &&
      (manualAttributionsToResources[attributionId] ||
        externalAttributionsToResources[attributionId])) ||
    []
  );
}

export function getIsSelectedResourceBreakpoint(state: State) {
  const breakpoints = getAttributionBreakpoints(state);
  const selectedResourceId = getSelectedResourceId(state);

  return breakpoints.has(selectedResourceId);
}
