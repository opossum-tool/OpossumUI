// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

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
}): Array<DisplayAttributionWithCount> {
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
  const hashToAttributions: { [hash: string]: Array<[string, PackageInfo]> } =
    {};

  attributionIdsWithCount.forEach(({ attributionId }): void => {
    const attribution: PackageInfo = attributions[attributionId];
    const savedHash = externalAttributionsToHashes[attributionId];

    if (savedHash) {
      if (!hashToAttributions[savedHash]) {
        hashToAttributions[savedHash] = [];
      }
      hashToAttributions[savedHash].push([attributionId, attribution]);
    } else {
      displayAttributionIdsWithCount.push(
        getDisplayAttributionWithCountFromAttributions([
          [attributionId, attribution],
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
  attributionsWithIds: Array<[string, PackageInfo]>
): DisplayAttributionWithCount {
  const displayAttributionConfidence: number = Math.min(
    ...attributionsWithIds.map(
      (attributionWithId): number =>
        attributionWithId[1].attributionConfidence || 0
    )
  );
  const comments: Array<string> = attributionsWithIds
    .map((attributionWithId) => attributionWithId[1].comment || '')
    .filter((comment: string | undefined) => comment !== '');
  const originIdsAsSet: Set<string> = attributionsWithIds.reduce(
    (originIdSet, attributionWithId) => {
      (attributionWithId[1].originIds ?? []).forEach((originId: string) =>
        originIdSet.add(originId)
      );
      return originIdSet;
    },
    new Set<string>()
  );
  const originIds: Array<string> = [...originIdsAsSet];

  const attributionIds = attributionsWithIds.map(
    (attributionWithId) => attributionWithId[0]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { comment, ...packageInfoWithoutComment } = attributionsWithIds[0][1];

  const attributionToShow: DisplayPackageInfo = {
    ...packageInfoWithoutComment,
    attributionConfidence: displayAttributionConfidence,
    attributionIds,
  };
  if (comments.length > 0) {
    attributionToShow.comments = comments;
  }
  if (originIds.length > 0) {
    attributionToShow.originIds = originIds;
  }

  return {
    attributionId: attributionsWithIds[0][0],
    attribution: attributionToShow,
  };
}
