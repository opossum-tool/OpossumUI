// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { cloneDeep, isEqual } from 'lodash';
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
import { PackagePanelTitle, View } from '../../enums/enums';
import { State } from '../../types/types';
import { getPopupAttributionId, getSelectedView } from './view-selector';
import { getStrippedPackageInfo } from '../../util/get-stripped-package-info';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getAttributionOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
} from './audit-view-resource-selectors';
import { getSelectedAttributionId } from './attribution-view-resource-selectors';

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
  state: State
): ResourcesToAttributions {
  return state.resourceState.allViews.manualData.resourcesToAttributions;
}

export function getManualAttributionsToResources(
  state: State
): AttributionsToResources {
  return state.resourceState.allViews.manualData.attributionsToResources;
}

export function getResourcesWithManualAttributedChildren(
  state: State
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
  state: State
): ResourcesToAttributions {
  return state.resourceState.allViews.externalData.resourcesToAttributions;
}

export function getExternalAttributionsToResources(
  state: State
): AttributionsToResources {
  return state.resourceState.allViews.externalData.attributionsToResources;
}

export function getResourcesWithExternalAttributedChildren(
  state: State
): ResourcesWithAttributedChildren {
  return state.resourceState.allViews.externalData
    .resourcesWithAttributedChildren;
}

export function getFrequentLicensesNameOrder(
  state: State
): Array<FrequentLicenseName> {
  return state.resourceState.allViews.frequentLicenses.nameOrder;
}

export function getFrequentLicensesTexts(state: State): LicenseTexts {
  return state.resourceState.allViews.frequentLicenses.texts;
}

export function getTemporaryPackageInfo(state: State): PackageInfo {
  return state.resourceState.allViews.temporaryPackageInfo;
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
      return getSelectedAttributionId(state);
    case View.Report:
      return getPopupAttributionId(state);
    case View.Audit:
      return getAttributionIdOfDisplayedPackageInManualPanel(state);
  }
}

export function getPackageInfoOfSelectedAttribution(
  state: State
): PackageInfo | null {
  const selectedAttributionId = getSelectedAttributionId(state);

  if (!selectedAttributionId) {
    return null;
  }
  const attributions = getManualAttributions(state);

  return attributions[selectedAttributionId];
}

export function getPackageInfoOfSelected(state: State): PackageInfo | null {
  return getSelectedView(state) === View.Audit
    ? getAttributionOfDisplayedPackageInManualPanel(state)
    : getPackageInfoOfSelectedAttribution(state);
}

export function wereTemporaryPackageInfoModified(state: State): boolean {
  if (
    getSelectedView(state) === View.Audit &&
    getDisplayedPackage(state)?.panel !== PackagePanelTitle.ManualPackages
  ) {
    return false;
  }

  const temporaryPackageInfo: PackageInfo = getTemporaryPackageInfo(state);
  const packageInfoOfSelected: PackageInfo =
    getPackageInfoOfSelected(state) || {};

  function hasPackageInfoChanged(): boolean {
    const temporaryPackageInfoWithoutConfidence = getStrippedPackageInfo(
      cloneDeep(temporaryPackageInfo)
    );
    const packageInfoOfSelectedWithoutConfidence = getStrippedPackageInfo(
      cloneDeep(packageInfoOfSelected)
    );
    delete temporaryPackageInfoWithoutConfidence.attributionConfidence;
    delete packageInfoOfSelectedWithoutConfidence.attributionConfidence;

    return !isEqual(
      temporaryPackageInfoWithoutConfidence,
      packageInfoOfSelectedWithoutConfidence
    );
  }

  function hasConfidenceChanged(): boolean {
    return (
      Boolean(packageInfoOfSelected.attributionConfidence) &&
      packageInfoOfSelected.attributionConfidence !==
        temporaryPackageInfo.attributionConfidence
    );
  }

  return hasPackageInfoChanged() || hasConfidenceChanged();
}

export function getIsSavingDisabled(state: State): boolean {
  return state.resourceState.allViews.isSavingDisabled;
}

export function getBaseUrlsForSources(state: State): BaseUrlsForSources {
  return state.resourceState.allViews.baseUrlsForSources;
}

export function getExternalAttributionSources(
  state: State
): ExternalAttributionSources {
  return state.resourceState.allViews.externalAttributionSources;
}

export function getAttributionIdMarkedForReplacement(state: State): string {
  return state.resourceState.allViews.attributionIdMarkedForReplacement;
}

export function getExternalAttributionsToHashes(
  state: State
): AttributionsToHashes {
  return state.resourceState.allViews.externalAttributionsToHashes;
}
