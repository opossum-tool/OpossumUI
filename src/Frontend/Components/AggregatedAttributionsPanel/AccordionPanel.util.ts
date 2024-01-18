// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  PackageInfo,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { Sorting } from '../../shared-constants';
import { AttributionIdWithCount, DisplayPackageInfos } from '../../types/types';
import { createPackageCardId } from '../../util/create-package-card-id';
import {
  getContainedExternalPackages,
  getContainedManualPackages,
} from '../../util/get-contained-packages';
import { getDisplayPackageInfoWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';
import { getPackageSorter } from '../../util/get-package-sorter';

export function getContainedExternalDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  externalData: AttributionData;
  resolvedExternalAttributions: Readonly<Set<string>>;
  attributionsToHashes: Readonly<AttributionsToHashes>;
  panelTitle: PackagePanelTitle;
  sorting: Sorting;
}): [Array<string>, DisplayPackageInfos] {
  const externalAttributionIdsWithCount = getContainedExternalPackages(
    args.selectedResourceId,
    args.externalData.resourcesWithAttributedChildren,
    args.externalData.resourcesToAttributions,
    args.resolvedExternalAttributions,
  );
  return getExternalDisplayPackageInfosWithCount(
    externalAttributionIdsWithCount,
    args.externalData.attributions,
    args.attributionsToHashes,
    args.panelTitle,
    args.sorting,
  );
}

export function getContainedManualDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  manualData: AttributionData;
  panelTitle: PackagePanelTitle;
  sorting: Sorting;
}): [Array<string>, DisplayPackageInfos] {
  const manualAttributionIdsWithCount = getContainedManualPackages(
    args.selectedResourceId,
    args.manualData,
  );
  const packageCardIds: Array<string> = [];
  const displayPackageInfos: DisplayPackageInfos = {};

  manualAttributionIdsWithCount.forEach(
    ({ attributionId, count }, index): void => {
      const packageInfo: PackageInfo =
        args.manualData.attributions[attributionId];
      const packageCardId = createPackageCardId(args.panelTitle, index);
      packageCardIds.push(packageCardId);
      displayPackageInfos[packageCardId] =
        getDisplayPackageInfoWithCountFromAttributions([
          [attributionId, packageInfo, count],
        ]);
    },
  );

  packageCardIds.sort(getPackageSorter(displayPackageInfos, args.sorting));

  return [packageCardIds, displayPackageInfos];
}

export function getExternalDisplayPackageInfosWithCount(
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributions: Attributions,
  externalAttributionsToHashes: AttributionsToHashes,
  panelTitle: PackagePanelTitle,
  sorting: Sorting,
): [Array<string>, DisplayPackageInfos] {
  const packageCardIds: Array<string> = [];
  const displayPackageInfos: DisplayPackageInfos = {};
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
      displayPackageInfos[packageCardId] =
        getDisplayPackageInfoWithCountFromAttributions([
          [attributionId, packageInfo, count],
        ]);
      indexCounter++;
    }
  });

  addMergedSignals(
    packageCardIds,
    displayPackageInfos,
    hashToAttributions,
    panelTitle,
    indexCounter,
  );

  packageCardIds.sort(getPackageSorter(displayPackageInfos, sorting));

  return [packageCardIds, displayPackageInfos];
}

function addMergedSignals(
  packageCardIds: Array<string>,
  displayPackageInfos: DisplayPackageInfos,
  hashToAttributions: {
    [hash: string]: Array<[string, PackageInfo, number | undefined]>;
  },
  panelTitle: PackagePanelTitle,
  indexCounter: number,
): void {
  Object.keys(hashToAttributions).forEach((hash: string): void => {
    const packageCardId = createPackageCardId(panelTitle, indexCounter);
    packageCardIds.push(packageCardId);
    displayPackageInfos[packageCardId] =
      getDisplayPackageInfoWithCountFromAttributions(hashToAttributions[hash]);
    indexCounter++;
  });
}
