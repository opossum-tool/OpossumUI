// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  Attributions,
  ExternalAttributionSources,
  Source,
} from '../../../shared/shared-types';

export function getSortedSources(
  attributions: Attributions,
  attributionIdsWithCount: Array<AttributionIdWithCount>,
  attributionSources: ExternalAttributionSources
): Array<string> {
  function reducer(
    sources: Set<string>,
    attributionIdWithCount: AttributionIdWithCount
  ): Set<string> {
    const source: Source | undefined =
      attributions[attributionIdWithCount.attributionId]?.source;
    sources.add(source ? source.name : '');

    return sources;
  }

  const sources = Array.from(
    attributionIdsWithCount.reduce(reducer, new Set())
  );

  return sortSources(sources, attributionSources);
}

function sortSources(
  sources: Array<string>,
  attributionSources: ExternalAttributionSources
): Array<string> {
  const existingUnknownSources: Array<string> = [];

  const sortedExistingKnownSources = sources
    .reduce((existingKnownSources: Array<string>, source: string) => {
      if (attributionSources.hasOwnProperty(source)) {
        existingKnownSources.push(source);
      } else {
        existingUnknownSources.push(source);
      }
      return existingKnownSources;
    }, [])
    .sort((sourceA, sourceB) => {
      return (
        attributionSources[sourceA]?.priority -
          attributionSources[sourceB]?.priority ||
        attributionSources[sourceA]?.name.localeCompare(
          attributionSources[sourceB]?.name
        )
      );
    });

  return sortedExistingKnownSources.concat(existingUnknownSources.sort());
}

export function getAttributionIdsWithCountForSource(
  attributionIds: Array<AttributionIdWithCount>,
  attributions: Attributions,
  sourceName: string
): Array<AttributionIdWithCount> {
  return attributionIds.filter((attributionIdWithCount) => {
    const source: Source | undefined =
      attributions[attributionIdWithCount.attributionId]?.source;

    return sourceName
      ? Boolean(source?.name && source?.name === sourceName)
      : !source;
  });
}
