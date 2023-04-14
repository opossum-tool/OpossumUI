// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  AttributionsToHashes,
  PackageInfo,
} from '../../../shared/shared-types';
import {
  AttributionIdWithCount,
  DisplayAttributionWithCount,
} from '../../types/types';
import {
  getContainedExternalPackages,
  getContainedManualPackages,
  PanelAttributionData,
} from '../../util/get-contained-packages';
import { getDisplayAttributionWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';

export function getDisplayContainedExternalPackagesWithCount(args: {
  selectedResourceId: string;
  externalData: Readonly<PanelAttributionData>;
  resolvedExternalAttributions: Readonly<Set<string>>;
  attributionsToHashes: Readonly<AttributionsToHashes>;
}): Array<DisplayAttributionWithCount> {
  const attributionIdsWithCount = getContainedExternalPackages(
    args.selectedResourceId,
    args.externalData.resourcesWithAttributedChildren,
    args.externalData.attributions,
    args.externalData.resourcesToAttributions,
    args.resolvedExternalAttributions
  );
  return getDisplayExternalAttributionsWithCount(
    attributionIdsWithCount,
    args.externalData.attributions,
    args.attributionsToHashes
  );
}

export function getDisplayContainedManualPackagesWithCount(args: {
  selectedResourceId: string;
  manualData: Readonly<PanelAttributionData>;
}): Array<DisplayAttributionWithCount> {
  const attributionIdsWithCount = getContainedManualPackages(
    args.selectedResourceId,
    args.manualData
  );

  const displayAttributionIdsWithCount: Array<DisplayAttributionWithCount> = [];

  attributionIdsWithCount.forEach(({ attributionId, count }): void => {
    const attribution: PackageInfo =
      args.manualData.attributions[attributionId];
    displayAttributionIdsWithCount.push(
      getDisplayAttributionWithCountFromAttributions([
        [attributionId, attribution, count],
      ])
    );
  });

  return displayAttributionIdsWithCount;
}

export function getDisplayExternalAttributionsWithCount(
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributions: Attributions,
  externalAttributionsToHashes: AttributionsToHashes
): Array<DisplayAttributionWithCount> {
  const displayAttributionIdsWithCount: Array<DisplayAttributionWithCount> = [];
  const hashToAttributions: {
    [hash: string]: Array<[string, PackageInfo, number | undefined]>;
  } = {};

  attributionIdsWithCount.forEach(({ attributionId, count }): void => {
    const attribution: PackageInfo = attributions[attributionId];
    const savedHash = externalAttributionsToHashes[attributionId];

    if (savedHash) {
      if (!hashToAttributions[savedHash]) {
        hashToAttributions[savedHash] = [];
      }
      hashToAttributions[savedHash].push([attributionId, attribution, count]);
    } else {
      displayAttributionIdsWithCount.push(
        getDisplayAttributionWithCountFromAttributions([
          [attributionId, attribution, count],
        ])
      );
    }
  });

  Object.keys(hashToAttributions).forEach((hash: string): void => {
    displayAttributionIdsWithCount.push(
      getDisplayAttributionWithCountFromAttributions(hashToAttributions[hash])
    );
  });

  return displayAttributionIdsWithCount;
}
