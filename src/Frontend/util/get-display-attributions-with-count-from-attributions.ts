// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';

export function getDisplayPackageInfoWithCountFromAttributions(
  attributionsWithIdsAndCounts: Array<
    [string, PackageInfo, number | undefined]
  >,
): PackageInfo {
  const displayAttributionConfidences: Array<number> =
    attributionsWithIdsAndCounts.reduce(
      (filteredConfidences, attributionWithIdAndCount) => {
        const confidence = attributionWithIdAndCount[1].attributionConfidence;
        if (confidence !== undefined) {
          filteredConfidences.push(confidence);
        }
        return filteredConfidences;
      },
      Array<number>(),
    );

  const counts: Array<number> = attributionsWithIdsAndCounts.reduce(
    (filteredCounts, attributionWithIdAndCount) => {
      const count = attributionWithIdAndCount[2];
      if (count !== undefined) {
        filteredCounts.push(count);
      }
      return filteredCounts;
    },
    Array<number>(),
  );

  const comments: Array<string> = attributionsWithIdsAndCounts.reduce(
    (filteredComments, attributionWithIdAndCount) => {
      filteredComments.push(...compact(attributionWithIdAndCount[1].comments));
      return filteredComments;
    },
    Array<string>(),
  );

  const originIdsAsSet: Set<string> = attributionsWithIdsAndCounts.reduce(
    (originIdSet, attributionWithIdAndCount) => {
      (attributionWithIdAndCount[1].originIds ?? []).forEach(
        (originId: string) => originIdSet.add(originId),
      );
      return originIdSet;
    },
    new Set<string>(),
  );
  const originIds: Array<string> = [...originIdsAsSet];

  const linkedAttributionIds = attributionsWithIdsAndCounts.map(
    (attributionWithIdAndCount) => attributionWithIdAndCount[0],
  );
  const atLeastOneAttributionWasPreferred = attributionsWithIdsAndCounts.some(
    (attributionWithIdAndCount) =>
      attributionWithIdAndCount[1].wasPreferred === true,
  );

  const attributionToShow: PackageInfo = {
    ...attributionsWithIdsAndCounts[0][1],
    linkedAttributionIds,
  };
  if (displayAttributionConfidences.length > 0) {
    attributionToShow.attributionConfidence = Math.min(
      ...displayAttributionConfidences,
    );
  }
  if (comments.length > 0) {
    attributionToShow.comments = comments;
  }
  if (originIds.length > 0) {
    attributionToShow.originIds = originIds;
  }
  if (atLeastOneAttributionWasPreferred) {
    attributionToShow.wasPreferred = true;
  }

  return {
    ...attributionToShow,
    count: Math.max(...counts, 0),
  };
}
