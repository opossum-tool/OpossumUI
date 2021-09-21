// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  Attributions,
  Source,
} from '../../../shared/shared-types';
import { AttributionSources } from '../../enums/enums';
import { prettifySource } from '../../util/prettify-source';

const ATTRIBUTION_SOURCES_ORDER: Array<string> = [
  AttributionSources.MERGER,
  AttributionSources.HHC,
  AttributionSources.MS,
  AttributionSources['REUSER:HHC'],
  AttributionSources['REUSER:MS'],
  AttributionSources['REUSER:SC'],
  AttributionSources['REUSER:HC'],
  AttributionSources.SC,
  AttributionSources.HC,
  AttributionSources.HINT,
];

export function getSortedPrettifiedSources(
  attributions: Attributions,
  attributionIdsWithCount: Array<AttributionIdWithCount>
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

  const prettifiedSources = sources.map(prettifySource);
  return sortSources(prettifiedSources);
}

function sortSources(sources: Array<string>): Array<string> {
  const existingKnownSources: Array<string> = ATTRIBUTION_SOURCES_ORDER.filter(
    (attributionSource) => sources.includes(attributionSource)
  );
  const existingUnknownSources: Array<string> = sources
    .filter(
      (attributionSource) =>
        !ATTRIBUTION_SOURCES_ORDER.includes(attributionSource)
    )
    .sort();

  return existingKnownSources.concat(existingUnknownSources);
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
      ? Boolean(source?.name && prettifySource(source.name) === sourceName)
      : !source;
  });
}
