// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, groupBy, min, omit, sortBy } from 'lodash-es';
import objectHash from 'object-hash';

import {
  type AttributionsToResources,
  type BaseUrlsForSources,
  Criticality,
  DiscreteConfidence,
  type FrequentLicenses,
  type PersistedAttributions,
  type PersistedPackageInfo,
  type RawAttributions,
  RawCriticality,
  type ResourcesToAttributions,
} from '../../shared/shared-types';
import type { RawFrequentLicense } from '../types/types';

export function addTrailingSlashIfAbsent(resourcePath: string): string {
  return resourcePath.endsWith('/') ? resourcePath : resourcePath.concat('/');
}

export function getAttributionsToResources(
  resourcesToAttributions: ResourcesToAttributions,
): AttributionsToResources {
  return Object.entries(
    resourcesToAttributions,
  ).reduce<AttributionsToResources>((acc, [resource, attributionIds]) => {
    attributionIds.forEach((attributionId) => {
      if (acc[attributionId]) {
        acc[attributionId].push(resource);
      } else {
        acc[attributionId] = [resource];
      }
    });
    return acc;
  }, {});
}

export const HASH_EXCLUDE_KEYS = [
  'attributionConfidence',
  'comment',
  'id',
  'originIds',
  'originalAttributionId',
  'originalAttributionSource',
  'originalAttributionWasPreferred',
  'preSelected',
  'wasPreferred',
] satisfies Array<keyof PersistedPackageInfo>;

export function mergePackageInfos(
  a: PersistedPackageInfo,
  b: PersistedPackageInfo,
): PersistedPackageInfo {
  const diff: Pick<PersistedPackageInfo, (typeof HASH_EXCLUDE_KEYS)[number]> = {
    attributionConfidence:
      min([a.attributionConfidence, b.attributionConfidence]) ??
      DiscreteConfidence.High,
    comment: compact([a.comment, b.comment]).join('\n\n'),
    id: a.id,
    originIds: Array.from(
      new Set([...(a.originIds ?? []), ...(b.originIds ?? [])]),
    ),
    originalAttributionId: a.originalAttributionId || b.originalAttributionId,
    originalAttributionSource:
      a.originalAttributionSource || b.originalAttributionSource,
    originalAttributionWasPreferred:
      a.originalAttributionWasPreferred || b.originalAttributionWasPreferred,
    preSelected: a.preSelected || b.preSelected,
    wasPreferred: a.wasPreferred || b.wasPreferred,
  };

  return { ...a, ...diff };
}

export function mergeAttributions({
  attributions,
  resourcesToAttributions,
  attributionsToResources,
}: {
  attributions: PersistedAttributions;
  resourcesToAttributions: ResourcesToAttributions;
  attributionsToResources: AttributionsToResources;
}): [PersistedAttributions, ResourcesToAttributions] {
  const attributionsWithResources = Object.values(
    attributions,
  ).map<PersistedPackageInfo>((attribution) => ({
    ...attribution,
    resources: sortBy(attributionsToResources[attribution.id]),
  }));

  const groups = Object.values(
    groupBy<PersistedPackageInfo>(attributionsWithResources, (attribution) =>
      objectHash(attribution, {
        excludeKeys: (key) =>
          HASH_EXCLUDE_KEYS.some((excludeKey) => excludeKey === key),
      }),
    ),
  );

  return groups.reduce<[PersistedAttributions, ResourcesToAttributions]>(
    ([attributions, resourcesToAttributions], group) => {
      const groupIds = group.map(({ id }) => id);
      const { resources, ...attribution } = group
        .slice(1)
        .reduce(
          (mergedAttribution, attribution) =>
            mergePackageInfos(mergedAttribution, attribution),
          group[0],
        );

      // Re-assign merged attribution to first attribution in group
      attributions[attribution.id] = attribution;

      // Remove obsolete attributions from attributions map
      group.slice(1).forEach(({ id }) => {
        delete attributions[id];
      });

      // Delete references to removed attributions
      resources?.forEach((resource) => {
        resourcesToAttributions[resource] = [
          attribution.id,
          ...resourcesToAttributions[resource].filter(
            (attributionId) => !groupIds.includes(attributionId),
          ),
        ];
      });

      return [attributions, resourcesToAttributions];
    },
    [attributions, resourcesToAttributions],
  );
}

export function deserializeAttributions(
  rawAttributions: RawAttributions,
  originalAttributions?: PersistedAttributions,
): PersistedAttributions {
  const firstOriginalAttributionByOriginId = originalAttributions
    ? indexOriginalAttributions(originalAttributions)
    : undefined;

  return Object.entries(rawAttributions).reduce<PersistedAttributions>(
    (
      attributions,
      [
        id,
        { followUp, comment, criticality, originId, originIds, ...attribution },
      ],
    ) => {
      const sanitizedComment = comment?.replace(/^\s+|\s+$/g, '');
      const effectiveOriginIds =
        originId || originIds?.length
          ? (originIds ?? []).concat(originId ?? [])
          : undefined;
      const originalAttribution = firstOriginalAttributionByOriginId
        ? findOriginalAttribution(
            effectiveOriginIds,
            firstOriginalAttributionByOriginId,
          )
        : { id, ...attribution };

      attributions[id] = {
        ...attribution,
        ...(effectiveOriginIds && { originIds: effectiveOriginIds }),
        ...(followUp === 'FOLLOW_UP' && { followUp: true }),
        criticality: deserializeCriticality(criticality),
        ...(originalAttribution && {
          originalAttributionId: originalAttribution.id,
          originalAttributionSource: originalAttribution.source,
          originalAttributionWasPreferred: originalAttribution.wasPreferred,
        }),
        ...(sanitizedComment && { comment: sanitizedComment }),
        id,
      };
      return attributions;
    },
    {},
  );
}

type IndexedOriginalAttribution = {
  attribution: PersistedPackageInfo;
  originalOrder: number;
};

function indexOriginalAttributions(
  originalAttributions: PersistedAttributions,
): Map<string, IndexedOriginalAttribution> {
  const index = new Map<string, IndexedOriginalAttribution>();

  Object.values(originalAttributions).forEach((attribution, order) => {
    const indexedAttribution = { attribution, originalOrder: order };
    attribution.originIds?.forEach((originId) => {
      if (!index.has(originId)) {
        index.set(originId, indexedAttribution);
      }
    });
  });

  return index;
}

function findOriginalAttribution(
  originIds: Array<string> | undefined,
  index: Map<string, IndexedOriginalAttribution>,
): PersistedPackageInfo | undefined {
  if (!originIds) {
    return undefined;
  }

  let match: IndexedOriginalAttribution | undefined;
  originIds.forEach((originId) => {
    const candidate = index.get(originId);
    if (
      candidate &&
      (!match || candidate.originalOrder < match.originalOrder)
    ) {
      match = candidate;
    }
  });

  return match?.attribution;
}

function deserializeCriticality(criticality: string | undefined): Criticality {
  switch (criticality) {
    case RawCriticality[Criticality.High]:
      return Criticality.High;
    case RawCriticality[Criticality.Medium]:
      return Criticality.Medium;
    default:
      return Criticality.None;
  }
}

export function serializeAttributions(
  attributions: PersistedAttributions,
): RawAttributions {
  return Object.entries(attributions).reduce<RawAttributions>(
    (
      rawAttributions,
      [
        attributionId,
        {
          criticality,
          count,
          followUp,
          id,
          originalAttributionId,
          originalAttributionSource,
          originalAttributionWasPreferred,
          relation,
          resources,
          source,
          suffix,
          synthetic,
          resourceAccess,
          ...attribution
        },
      ],
    ) => {
      rawAttributions[attributionId] = {
        ...omit(attribution, 'aiStatus'),
        ...(followUp && { followUp: 'FOLLOW_UP' }),
        criticality: RawCriticality[criticality],
      };
      return rawAttributions;
    },
    {},
  );
}

export function parseFrequentLicenses(
  rawFrequentLicenses: Array<RawFrequentLicense> | undefined,
): FrequentLicenses {
  const parsedFrequentLicenses: FrequentLicenses = { nameOrder: [], texts: {} };
  if (!rawFrequentLicenses) {
    return parsedFrequentLicenses;
  }

  rawFrequentLicenses.forEach((rawFrequentLicense) => {
    parsedFrequentLicenses.nameOrder.push({
      shortName: rawFrequentLicense.shortName,
      fullName: rawFrequentLicense.fullName,
    });
    parsedFrequentLicenses.texts[rawFrequentLicense.shortName] =
      rawFrequentLicense.defaultText;
    parsedFrequentLicenses.texts[rawFrequentLicense.fullName] =
      rawFrequentLicense.defaultText;
  });

  return parsedFrequentLicenses;
}

export function sanitizeRawBaseUrlsForSources(
  rawBaseUrlsForSources: BaseUrlsForSources | undefined,
): BaseUrlsForSources {
  return rawBaseUrlsForSources
    ? Object.fromEntries(
        Object.entries(rawBaseUrlsForSources).map(([path, url]) => {
          return [addTrailingSlashIfAbsent(path), url];
        }),
      )
    : {};
}
