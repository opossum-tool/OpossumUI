// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { sum } from 'lodash';
import {
  Attributions,
  AttributionsToHashes,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import {
  AttributionIdWithCount,
  DisplayAttributionWithCount,
} from '../../types/types';
import {
  getContainedExternalPackages,
  PanelAttributionData,
} from '../../util/get-contained-packages';

export function getDisplayContainedExternalPackagesWithCount(args: {
  selectedResourceId: string;
  externalData: Readonly<PanelAttributionData>;
  resolvedExternalAttributions: Readonly<Set<string>>;
  attributionsToHashes: Readonly<AttributionsToHashes>;
}): Array<AttributionIdWithCount> {
  const attributionIdsWithCount = getContainedExternalPackages(
    args.selectedResourceId,
    args.externalData.resourcesWithAttributedChildren,
    args.externalData.attributions,
    args.externalData.resourcesToAttributions,
    args.resolvedExternalAttributions
  );
  return getDisplayAttributionsWithCount(
    attributionIdsWithCount,
    args.externalData.attributions,
    args.attributionsToHashes
  );
}

export function getDisplayAttributionsWithCount(
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

function getDisplayAttributionWithCountFromAttributions(
  attributionsWithIdsAndCounts: Array<[string, PackageInfo, number | undefined]>
): DisplayAttributionWithCount {
  const displayAttributionConfidence: number = Math.min(
    ...attributionsWithIdsAndCounts.map(
      (attributionWithId): number =>
        attributionWithId[1].attributionConfidence || 0
    )
  );

  const counts: Array<number> = attributionsWithIdsAndCounts.reduce(
    (filteredCounts, attributionWithIdAndCount) => {
      const count = attributionWithIdAndCount[2];
      if (count !== undefined) {
        filteredCounts.push(count);
      }
      return filteredCounts;
    },
    Array<number>()
  );

  const comments: Array<string> = attributionsWithIdsAndCounts.reduce(
    (filteredComments, attributionWithIdAndCount) => {
      const comment = attributionWithIdAndCount[1].comment || '';
      if (comment !== '') {
        filteredComments.push(comment);
      }
      return filteredComments;
    },
    Array<string>()
  );

  const originIdsAsSet: Set<string> = attributionsWithIdsAndCounts.reduce(
    (originIdSet, attributionWithId) => {
      (attributionWithId[1].originIds ?? []).forEach((originId: string) =>
        originIdSet.add(originId)
      );
      return originIdSet;
    },
    new Set<string>()
  );
  const originIds: Array<string> = [...originIdsAsSet];

  const attributionIds = attributionsWithIdsAndCounts.map(
    (attributionWithId) => attributionWithId[0]
  );

  const attributionToShow: DisplayPackageInfo = {
    ...attributionsWithIdsAndCounts[0][1],
    type: 'DisplayPackageInfo',
    attributionConfidence: displayAttributionConfidence,
    attributionIds,
  };
  delete attributionToShow.comment;
  if (comments.length > 0) {
    attributionToShow.comments = comments;
  }
  if (originIds.length > 0) {
    attributionToShow.originIds = originIds;
  }

  return {
    attributionId: attributionsWithIdsAndCounts[0][0],
    count: counts.length > 0 ? sum(counts) : undefined,
    attribution: attributionToShow,
  };
}
