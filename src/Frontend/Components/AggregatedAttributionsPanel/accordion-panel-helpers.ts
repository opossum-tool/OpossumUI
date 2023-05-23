// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  AttributionsToHashes,
  PackageInfo,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import {
  AttributionIdWithCount,
  DisplayPackageInfosWithCount,
} from '../../types/types';
import {
  getContainedExternalPackages,
  getContainedManualPackages,
  PanelAttributionData,
} from '../../util/get-contained-packages';
import { getDisplayPackageInfoWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';
import { createPackageCardId } from '../../util/create-package-card-id';

export function getContainedExternalDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  externalData: Readonly<PanelAttributionData>;
  resolvedExternalAttributions: Readonly<Set<string>>;
  attributionsToHashes: Readonly<AttributionsToHashes>;
  panelTitle: PackagePanelTitle;
}): [Array<string>, DisplayPackageInfosWithCount] {
  const externalAttributionIdsWithCount = getContainedExternalPackages(
    args.selectedResourceId,
    args.externalData.resourcesWithAttributedChildren,
    args.externalData.attributions,
    args.externalData.resourcesToAttributions,
    args.resolvedExternalAttributions
  );
  return getExternalDisplayPackageInfosWithCount(
    externalAttributionIdsWithCount,
    args.externalData.attributions,
    args.attributionsToHashes,
    args.panelTitle
  );
}

export function getContainedManualDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  manualData: Readonly<PanelAttributionData>;
  panelTitle: PackagePanelTitle;
}): [Array<string>, DisplayPackageInfosWithCount] {
  const manualAttributionIdsWithCount = getContainedManualPackages(
    args.selectedResourceId,
    args.manualData
  );
  const packageCardIds: Array<string> = [];
  const displayPackageInfosWithCount: DisplayPackageInfosWithCount = {};

  manualAttributionIdsWithCount.forEach(
    ({ attributionId, count }, index): void => {
      const packageInfo: PackageInfo =
        args.manualData.attributions[attributionId];
      const packageCardId = createPackageCardId(args.panelTitle, index);
      packageCardIds.push(packageCardId);
      displayPackageInfosWithCount[packageCardId] =
        getDisplayPackageInfoWithCountFromAttributions([
          [attributionId, packageInfo, count],
        ]);
    }
  );

  return [packageCardIds, displayPackageInfosWithCount];
}

export function getExternalDisplayPackageInfosWithCount(
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributions: Attributions,
  externalAttributionsToHashes: AttributionsToHashes,
  panelTitle: PackagePanelTitle
): [Array<string>, DisplayPackageInfosWithCount] {
  const packageCardIds: Array<string> = [];
  const displayPackageInfosWithCount: DisplayPackageInfosWithCount = {};
  const hashToAttributions: {
    [hash: string]: Array<[string, PackageInfo, number | undefined]>;
  } = {};
  let indexCounter = 0;

  attributionIdsWithCount.forEach(({ attributionId, count }): void => {
    const packageInfo: PackageInfo = attributions[attributionId];
    const savedHash = externalAttributionsToHashes[attributionId];

    if (savedHash) {
      if (!hashToAttributions[savedHash]) {
        hashToAttributions[savedHash] = [];
      }
      hashToAttributions[savedHash].push([attributionId, packageInfo, count]);
    } else {
      const packageCardId = createPackageCardId(panelTitle, indexCounter);
      packageCardIds.push(packageCardId);
      displayPackageInfosWithCount[packageCardId] =
        getDisplayPackageInfoWithCountFromAttributions([
          [attributionId, packageInfo, count],
        ]);
      indexCounter++;
    }
  });

  addMergedSignals(
    packageCardIds,
    displayPackageInfosWithCount,
    hashToAttributions,
    panelTitle,
    indexCounter
  );

  return [packageCardIds, displayPackageInfosWithCount];
}

function addMergedSignals(
  packageCardIds: Array<string>,
  displayPackageInfosWithCount: DisplayPackageInfosWithCount,
  hashToAttributions: {
    [hash: string]: Array<[string, PackageInfo, number | undefined]>;
  },
  panelTitle: PackagePanelTitle,
  indexCounter: number
): void {
  Object.keys(hashToAttributions).forEach((hash: string): void => {
    const packageCardId = createPackageCardId(panelTitle, indexCounter);
    packageCardIds.push(packageCardId);
    displayPackageInfosWithCount[packageCardId] =
      getDisplayPackageInfoWithCountFromAttributions(hashToAttributions[hash]);
    indexCounter++;
  });
}
