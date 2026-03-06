// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  ClassificationsConfig,
  ExternalAttributionSources,
  FrequentLicenseName,
  LicenseTexts,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { State } from '../../types/types';

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

export function getClassifications(state: State): ClassificationsConfig {
  return state.resourceState.config.classifications;
}

export function getIsPackageInfoDirty(state: State): boolean {
  return state.resourceState.isPackageInfoDirty;
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

export function getIsSelectedResourceBreakpoint(state: State) {
  const breakpoints = getAttributionBreakpoints(state);
  const selectedResourceId = getSelectedResourceId(state);

  return breakpoints.has(selectedResourceId);
}
