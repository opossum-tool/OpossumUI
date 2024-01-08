// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  AttributionsToHashes,
  Criticality,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import {
  AttributionIdWithCount,
  DisplayPackageInfosWithCount,
} from '../../types/types';
import { createPackageCardId } from '../../util/create-package-card-id';
import {
  getContainedExternalPackages,
  getContainedManualPackages,
  PanelAttributionData,
} from '../../util/get-contained-packages';
import { getDisplayPackageInfoWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';

export function getContainedExternalDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  externalData: Readonly<PanelAttributionData>;
  resolvedExternalAttributions: Readonly<Set<string>>;
  attributionsToHashes: Readonly<AttributionsToHashes>;
  panelTitle: PackagePanelTitle;
  sortByCriticality: boolean;
}): [Array<string>, DisplayPackageInfosWithCount] {
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
    args.sortByCriticality,
  );
}

export function getContainedManualDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  manualData: Readonly<PanelAttributionData>;
  panelTitle: PackagePanelTitle;
  sortByCriticality: boolean;
}): [Array<string>, DisplayPackageInfosWithCount] {
  const manualAttributionIdsWithCount = getContainedManualPackages(
    args.selectedResourceId,
    args.manualData,
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
    },
  );

  packageCardIds.sort(
    sortDisplayPackageInfosWithCountByCriticalityAndCountAndPackageName(
      displayPackageInfosWithCount,
      args.sortByCriticality,
    ),
  );

  return [packageCardIds, displayPackageInfosWithCount];
}

export function getExternalDisplayPackageInfosWithCount(
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributions: Attributions,
  externalAttributionsToHashes: AttributionsToHashes,
  panelTitle: PackagePanelTitle,
  sortByCriticality: boolean,
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
    indexCounter,
  );

  packageCardIds.sort(
    sortDisplayPackageInfosWithCountByCriticalityAndCountAndPackageName(
      displayPackageInfosWithCount,
      sortByCriticality,
    ),
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
  indexCounter: number,
): void {
  Object.keys(hashToAttributions).forEach((hash: string): void => {
    const packageCardId = createPackageCardId(panelTitle, indexCounter);
    packageCardIds.push(packageCardId);
    displayPackageInfosWithCount[packageCardId] =
      getDisplayPackageInfoWithCountFromAttributions(hashToAttributions[hash]);
    indexCounter++;
  });
}

export function getNumericalCriticalityValue(
  criticality: Criticality | undefined,
) {
  switch (criticality) {
    case Criticality.High:
      return 2;
    case Criticality.Medium:
      return 1;
    default:
      return 0;
  }
}

//exported for testing
export function sortDisplayPackageInfosWithCountByCriticalityAndCountAndPackageName(
  displayPackageInfosWithCount: DisplayPackageInfosWithCount,
  sortByCriticality: boolean = false,
) {
  return function (id1: string, id2: string): number {
    const p1: DisplayPackageInfo =
      displayPackageInfosWithCount[id1].displayPackageInfo;
    const p2: DisplayPackageInfo =
      displayPackageInfosWithCount[id2].displayPackageInfo;

    if (sortByCriticality && p1?.criticality !== p2?.criticality) {
      return (
        getNumericalCriticalityValue(p2?.criticality) -
        getNumericalCriticalityValue(p1?.criticality)
      );
    }

    if (
      displayPackageInfosWithCount[id1].count !==
      displayPackageInfosWithCount[id2].count
    ) {
      return (
        displayPackageInfosWithCount[id2].count -
        displayPackageInfosWithCount[id1].count
      );
    }

    if (p1?.packageName && p2?.packageName) {
      return p1.packageName.toLowerCase() < p2.packageName.toLowerCase()
        ? -1
        : 1;
    } else if (p1?.packageName) {
      return -1;
    } else if (p2?.packageName) {
      return 1;
    }
    return 0;
  };
}
