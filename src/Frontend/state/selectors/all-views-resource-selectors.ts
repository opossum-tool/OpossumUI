// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqual } from 'lodash';

import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
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
import {
  AllowedSaveOperations,
  PackagePanelTitle,
  View,
} from '../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { PanelPackage, State } from '../../types/types';
import { getStrippedPackageInfo } from '../../util/get-stripped-package-info';
import { getSelectedAttributionIdInAttributionView } from './attribution-view-resource-selectors';
import { getPopupAttributionId, getSelectedView } from './view-selector';

export function getResources(state: State): Resources | null {
  return state.resourceState.allViews.resources;
}

export function getManualData(state: State): AttributionData {
  return state.resourceState.allViews.manualData;
}

export function getManualAttributions(state: State): Attributions {
  return state.resourceState.allViews.manualData.attributions;
}

export function getResourcesToManualAttributions(
  state: State,
): ResourcesToAttributions {
  return state.resourceState.allViews.manualData.resourcesToAttributions;
}

export function getManualAttributionsToResources(
  state: State,
): AttributionsToResources {
  return state.resourceState.allViews.manualData.attributionsToResources;
}

export function getResourcesWithManualAttributedChildren(
  state: State,
): ResourcesWithAttributedChildren {
  return state.resourceState.allViews.manualData
    .resourcesWithAttributedChildren;
}

export function getExternalData(state: State): AttributionData {
  return state.resourceState.allViews.externalData;
}

export function getExternalAttributions(state: State): Attributions {
  return state.resourceState.allViews.externalData.attributions;
}

export function getResourcesToExternalAttributions(
  state: State,
): ResourcesToAttributions {
  return state.resourceState.allViews.externalData.resourcesToAttributions;
}

export function getExternalAttributionsToResources(
  state: State,
): AttributionsToResources {
  return state.resourceState.allViews.externalData.attributionsToResources;
}

export function getResourcesWithExternalAttributedChildren(
  state: State,
): ResourcesWithAttributedChildren {
  return state.resourceState.allViews.externalData
    .resourcesWithAttributedChildren;
}

export function getFrequentLicensesNameOrder(
  state: State,
): Array<FrequentLicenseName> {
  return state.resourceState.allViews.frequentLicenses.nameOrder;
}

export function getFrequentLicensesTexts(state: State): LicenseTexts {
  return state.resourceState.allViews.frequentLicenses.texts;
}

export function getTemporaryDisplayPackageInfo(state: State): PackageInfo {
  return state.resourceState.allViews.temporaryDisplayPackageInfo;
}

export function getAttributionBreakpoints(state: State): Set<string> {
  return state.resourceState.allViews.attributionBreakpoints;
}

export function getFilesWithChildren(state: State): Set<string> {
  return state.resourceState.allViews.filesWithChildren;
}

export function getProjectMetadata(state: State): ProjectMetadata {
  return state.resourceState.allViews.metadata;
}

export function getCurrentAttributionId(state: State): string | null {
  switch (getSelectedView(state)) {
    case View.Attribution:
      return getSelectedAttributionIdInAttributionView(state);
    case View.Report:
      return getPopupAttributionId(state);
    case View.Audit:
      return getAttributionIdOfDisplayedPackageInManualPanel(state);
  }
}

export function getDisplayPackageInfoOfSelectedAttributionInAttributionView(
  state: State,
): PackageInfo | null {
  const selectedAttributionIdInAttributionView =
    getSelectedAttributionIdInAttributionView(state);

  if (!selectedAttributionIdInAttributionView) {
    return null;
  }
  const attributions = getManualAttributions(state);
  const selectedPackageInfo =
    attributions[selectedAttributionIdInAttributionView];
  return selectedPackageInfo
    ? attributions[selectedAttributionIdInAttributionView]
    : null;
}

export function getManualDisplayPackageInfoOfSelected(
  state: State,
): PackageInfo | null {
  return getSelectedView(state) === View.Audit
    ? getDisplayPackageInfoOfDisplayedPackageInManualPanel(state)
    : getDisplayPackageInfoOfSelectedAttributionInAttributionView(state);
}

export function getDisplayPackageInfoOfSelected(
  state: State,
): PackageInfo | null {
  return getSelectedView(state) === View.Audit
    ? getDisplayPackageInfoOfDisplayedPackage(state)
    : getDisplayPackageInfoOfSelectedAttributionInAttributionView(state);
}

export function wereTemporaryDisplayPackageInfoModified(state: State): boolean {
  if (
    getSelectedView(state) === View.Audit &&
    getDisplayedPackage(state)?.panel !== PackagePanelTitle.ManualPackages
  ) {
    return false;
  }

  const temporaryDisplayPackageInfo: PackageInfo =
    getTemporaryDisplayPackageInfo(state);
  const displayPackageInfoOfSelected: PackageInfo =
    getManualDisplayPackageInfoOfSelected(state) || EMPTY_DISPLAY_PACKAGE_INFO;

  return !isEqual(
    getStrippedPackageInfo(temporaryDisplayPackageInfo),
    getStrippedPackageInfo(displayPackageInfoOfSelected),
  );
}

export function getIsSavingDisabled(state: State): boolean {
  return (
    state.resourceState.allViews.allowedSaveOperations ===
    AllowedSaveOperations.None
  );
}

export function getIsGlobalSavingDisabled(state: State): boolean {
  return (
    state.resourceState.allViews.allowedSaveOperations !==
    AllowedSaveOperations.All
  );
}

export function getBaseUrlsForSources(state: State): BaseUrlsForSources {
  return state.resourceState.allViews.baseUrlsForSources;
}

export function getExternalAttributionSources(
  state: State,
): ExternalAttributionSources {
  return state.resourceState.allViews.externalAttributionSources;
}

export function getExternalAttributionsToHashes(
  state: State,
): AttributionsToHashes {
  return state.resourceState.allViews.externalAttributionsToHashes;
}

export function getResourcesWithLocatedAttributions(state: State): {
  resourcesWithLocatedChildren: Set<string>;
  locatedResources: Set<string>;
} {
  return state.resourceState.allViews.resourcesWithLocatedAttributions;
}

export function getIsPreferenceFeatureEnabled(state: State): boolean {
  return state.resourceState.allViews.isPreferenceFeatureEnabled;
}

export function getAttributionIdOfDisplayedPackageInManualPanel(
  state: State,
): string | null {
  if (
    state.resourceState.auditView.displayedPanelPackage?.panel ===
    PackagePanelTitle.ManualPackages
  ) {
    return (
      state.resourceState.auditView.displayedPanelPackage.displayPackageInfo
        .id || null
    );
  }
  return null;
}

export function getDisplayPackageInfoOfDisplayedPackage(
  state: State,
): PackageInfo | null {
  return (
    state.resourceState.auditView.displayedPanelPackage?.displayPackageInfo ||
    null
  );
}

export function getDisplayPackageInfoOfDisplayedPackageInManualPanel(
  state: State,
): PackageInfo | null {
  const attributionId = getAttributionIdOfDisplayedPackageInManualPanel(state);
  if (attributionId) {
    const manualAttributions: Attributions = getManualAttributions(state);
    return manualAttributions[attributionId];
  }
  return null;
}
export function getDisplayedPackage(state: State): PanelPackage | null {
  return state.resourceState.auditView.displayedPanelPackage;
}

export function getResourceIdsOfSelectedAttribution(
  state: State,
): Array<string> | null {
  const attributionId = getCurrentAttributionId(state);
  const manualAttributionsToResources = getManualAttributionsToResources(state);

  if (attributionId && attributionId in manualAttributionsToResources) {
    return manualAttributionsToResources[attributionId];
  }

  return null;
}
