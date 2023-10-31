// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo, PackageInfo } from '../../shared/shared-types';
import { DisplayPackageInfoWithCount } from '../types/types';

export function getDisplayPackageInfoWithCountFromAttributions(
  attributionsWithIdsAndCounts: Array<
    [string, PackageInfo, number | undefined]
  >,
): DisplayPackageInfoWithCount {
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
      const comment = attributionWithIdAndCount[1].comment || '';
      if (comment !== '') {
        filteredComments.push(comment);
      }
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

  const attributionIds = attributionsWithIdsAndCounts.map(
    (attributionWithIdAndCount) => attributionWithIdAndCount[0],
  );
  const atLeastOneAttributionWasPreferred = attributionsWithIdsAndCounts.some(
    (attributionWithIdAndCount) =>
      attributionWithIdAndCount[1].wasPreferred === true,
  );

  const { comment, ...packageInfoWithoutComment } =
    attributionsWithIdsAndCounts[0][1];

  const attributionToShow: DisplayPackageInfo = {
    ...packageInfoWithoutComment,
    attributionIds,
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
    count: Math.max(...counts, 0),
    displayPackageInfo: attributionToShow,
  };
}
