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
  DisplayPackageInfo,
  ExternalAttributionSources,
  FrequentLicenseName,
  LicenseTexts,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { PackagePanelTitle, View } from '../../enums/enums';
import { State } from '../../types/types';
import { getPopupAttributionId, getSelectedView } from './view-selector';
import { getStrippedDisplayPackageInfo } from '../../util/get-stripped-package-info';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getDisplayPackageInfoOfDisplayedPackage,
  getDisplayPackageInfoOfDisplayedPackageInManualPanel,
} from './audit-view-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from './attribution-view-resource-selectors';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';

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

export function getTemporaryDisplayPackageInfo(
  state: State,
): DisplayPackageInfo {
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
): DisplayPackageInfo | null {
  const selectedAttributionIdInAttributionView =
    getSelectedAttributionIdInAttributionView(state);

  if (!selectedAttributionIdInAttributionView) {
    return null;
  }
  const attributions = getManualAttributions(state);
  const selectedPackageInfo =
    attributions[selectedAttributionIdInAttributionView];
  return selectedPackageInfo
    ? convertPackageInfoToDisplayPackageInfo(
        attributions[selectedAttributionIdInAttributionView],
        [selectedAttributionIdInAttributionView],
      )
    : null;
}

export function getManualDisplayPackageInfoOfSelected(
  state: State,
): DisplayPackageInfo | null {
  return getSelectedView(state) === View.Audit
    ? getDisplayPackageInfoOfDisplayedPackageInManualPanel(state)
    : getDisplayPackageInfoOfSelectedAttributionInAttributionView(state);
}

export function getDisplayPackageInfoOfSelected(
  state: State,
): DisplayPackageInfo | null {
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

  const temporaryDisplayPackageInfo: DisplayPackageInfo =
    getTemporaryDisplayPackageInfo(state);
  const displayPackageInfoOfSelected: DisplayPackageInfo =
    getManualDisplayPackageInfoOfSelected(state) || EMPTY_DISPLAY_PACKAGE_INFO;

  function hasPackageInfoChanged(): boolean {
    const strippedTemporaryDisplayPackageInfo = getStrippedDisplayPackageInfo(
      cloneDeep(temporaryDisplayPackageInfo),
    );
    const strippedDisplayPackageInfoOfSelected = getStrippedDisplayPackageInfo(
      cloneDeep(displayPackageInfoOfSelected),
    );
    delete strippedTemporaryDisplayPackageInfo.attributionConfidence;
    delete strippedDisplayPackageInfoOfSelected.attributionConfidence;

    return !isEqual(
      strippedTemporaryDisplayPackageInfo,
      strippedDisplayPackageInfoOfSelected,
    );
  }

  function hasConfidenceChanged(): boolean {
    return (
      Boolean(displayPackageInfoOfSelected.attributionConfidence) &&
      displayPackageInfoOfSelected.attributionConfidence !==
        temporaryDisplayPackageInfo.attributionConfidence
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
  state: State,
): ExternalAttributionSources {
  return state.resourceState.allViews.externalAttributionSources;
}

export function getAttributionIdMarkedForReplacement(state: State): string {
  return state.resourceState.allViews.attributionIdMarkedForReplacement;
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
