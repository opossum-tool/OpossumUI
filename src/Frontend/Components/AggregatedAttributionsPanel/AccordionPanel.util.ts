// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  PackageInfo,
} from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { Sorting } from '../../shared-constants';
import { AttributionIdWithCount } from '../../types/types';
import { createPackageCardId } from '../../util/create-package-card-id';
import {
  getContainedExternalPackages,
  getContainedManualPackages,
} from '../../util/get-contained-packages';
import { getPackageSorter } from '../../util/get-package-sorter';

export function getContainedExternalDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  externalData: AttributionData;
  resolvedExternalAttributions: Readonly<Set<string>>;
  panelTitle: PackagePanelTitle;
  sorting: Sorting;
}): [Array<string>, Attributions] {
  const externalAttributionIdsWithCount = getContainedExternalPackages(
    args.selectedResourceId,
    args.externalData.resourcesWithAttributedChildren,
    args.externalData.resourcesToAttributions,
    args.resolvedExternalAttributions,
  );
  return getExternalDisplayPackageInfosWithCount(
    externalAttributionIdsWithCount,
    args.externalData.attributions,
    args.panelTitle,
    args.sorting,
  );
}

export function getContainedManualDisplayPackageInfosWithCount(args: {
  selectedResourceId: string;
  manualData: AttributionData;
  panelTitle: PackagePanelTitle;
  sorting: Sorting;
}): [Array<string>, Attributions] {
  const manualAttributionIdsWithCount = getContainedManualPackages(
    args.selectedResourceId,
    args.manualData,
  );
  const packageCardIds: Array<string> = [];
  const displayPackageInfos: Attributions = {};

  manualAttributionIdsWithCount.forEach(
    ({ attributionId, count }, index): void => {
      const packageInfo: PackageInfo =
        args.manualData.attributions[attributionId];
      const packageCardId = createPackageCardId(args.panelTitle, index);
      packageCardIds.push(packageCardId);
      displayPackageInfos[packageCardId] = {
        ...packageInfo,
        count,
      };
    },
  );

  packageCardIds.sort(getPackageSorter(displayPackageInfos, args.sorting));

  return [packageCardIds, displayPackageInfos];
}

export function getExternalDisplayPackageInfosWithCount(
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributions: Attributions,
  panelTitle: PackagePanelTitle,
  sorting: Sorting,
): [Array<string>, Attributions] {
  const packageCardIds: Array<string> = [];
  const displayPackageInfos: Attributions = {};
  let indexCounter = 0;

  attributionIdsWithCount.forEach(({ attributionId, count }): void => {
    const packageInfo: PackageInfo = attributions[attributionId];

    const packageCardId = createPackageCardId(panelTitle, indexCounter);
    packageCardIds.push(packageCardId);
    displayPackageInfos[packageCardId] = {
      ...packageInfo,
      count,
    };
    indexCounter++;
  });

  packageCardIds.sort(getPackageSorter(displayPackageInfos, sorting));

  return [packageCardIds, displayPackageInfos];
}
