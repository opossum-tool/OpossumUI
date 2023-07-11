// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ExternalAttributionSources } from '../../../shared/shared-types';
import {
  DisplayPackageInfos,
  DisplayPackageInfosWithCount,
} from '../../types/types';

export function getPackageCardIdsAndDisplayPackageInfosForSource(
  displayPackageInfosWithCount: DisplayPackageInfosWithCount,
  sortedPackageCardIds: Array<string>,
  sourceName: string | null,
): [Array<string>, DisplayPackageInfos] {
  const filteredAndSortedPackageCardIds: Array<string> = [];
  const filteredDisplayPackageInfos: DisplayPackageInfos = {};

  sortedPackageCardIds.forEach((packageCardId) => {
    if (
      sourceName ===
      (displayPackageInfosWithCount[packageCardId].displayPackageInfo?.source
        ?.name || null)
    ) {
      filteredAndSortedPackageCardIds.push(packageCardId);
      filteredDisplayPackageInfos[packageCardId] =
        displayPackageInfosWithCount[packageCardId].displayPackageInfo;
    }
  });

  return [filteredAndSortedPackageCardIds, filteredDisplayPackageInfos];
}

export function getSortedSourcesFromDisplayPackageInfosWithCount(
  displayPackageInfosWithCount: DisplayPackageInfosWithCount,
  attributionSources: ExternalAttributionSources,
): Array<string | null> {
  const sourceNames = new Set<string | null>();
  Object.values(displayPackageInfosWithCount).forEach(
    ({ displayPackageInfo }) => {
      sourceNames.add(displayPackageInfo?.source?.name || null);
    },
    sourceNames,
  );
  return sortSources(Array.from(sourceNames), attributionSources);
}

function sortSources(
  sources: Array<string | null>,
  attributionSources: ExternalAttributionSources,
): Array<string | null> {
  const { knownSources, unknownSources } = sources.reduce(
    (
      encounteredSources: {
        knownSources: Array<string>;
        unknownSources: Array<string | null>;
      },
      source: string | null,
    ) => {
      if (source === null) {
        encounteredSources.unknownSources.push(source);
        return encounteredSources;
      }
      if (attributionSources.hasOwnProperty(source)) {
        encounteredSources.knownSources.push(source);
      } else {
        encounteredSources.unknownSources.push(source);
      }
      return encounteredSources;
    },
    { knownSources: [], unknownSources: [] },
  );

  const sortedKnownSources = knownSources.sort((sourceA, sourceB) =>
    compareKnownSources(sourceA, sourceB, attributionSources),
  );
  const sortedUnknownSources = unknownSources.sort(compareUnknownSources);

  return [...sortedKnownSources, ...sortedUnknownSources];
}

function compareKnownSources(
  sourceA: string,
  sourceB: string,
  attributionSources: ExternalAttributionSources,
): number {
  return (
    -(
      attributionSources[sourceA]?.priority -
      attributionSources[sourceB]?.priority
    ) ||
    (attributionSources[sourceA]?.name.toLowerCase() <
    attributionSources[sourceB]?.name.toLowerCase()
      ? -1
      : 1)
  );
}

function compareUnknownSources(
  sourceA: string | null,
  sourceB: string | null,
): number {
  if (sourceA === null) {
    return 1;
  }
  if (sourceB === null) {
    return -1;
  }
  return sourceA.toLowerCase() < sourceB.toLowerCase() ? -1 : 1;
}
