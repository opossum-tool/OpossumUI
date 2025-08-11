// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, groupBy, min, sortBy } from 'lodash';
import objectHash from 'object-hash';

import { canResourceHaveChildren } from '../../Frontend/util/can-resource-have-children';
import {
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  Criticality,
  DiscreteConfidence,
  FrequentLicenses,
  PackageInfo,
  RawAttributions,
  RawCriticality,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { RawFrequentLicense } from '../types/types';

export function addTrailingSlashIfAbsent(resourcePath: string): string {
  return resourcePath.endsWith('/') ? resourcePath : resourcePath.concat('/');
}

function getListOfResourcePaths(
  basePath: string,
  resourceName: string,
  resources: Resources,
): Array<string> {
  const fullResourcePath =
    basePath + resourceName + (canResourceHaveChildren(resources) ? '/' : '');

  return [fullResourcePath].concat(
    Object.keys(resources)
      .map((childPath) =>
        getListOfResourcePaths(
          fullResourcePath,
          childPath,
          resources[childPath] as Resources,
        ),
      )
      .flat(),
  );
}

export function getAllResourcePaths(resources: Resources): Set<string> {
  return new Set(getListOfResourcePaths('', '', resources));
}

export function sanitizeResourcesToAttributions(
  resources: Resources,
  rawResourcesToAttributions: ResourcesToAttributions,
): ResourcesToAttributions {
  const allResourcePaths = getAllResourcePaths(resources);

  return Object.fromEntries(
    Object.entries(rawResourcesToAttributions).reduce(
      (
        accumulatedResult: Array<[string, Array<string>]>,
        [path, attributions],
      ) => {
        const pathWithSlash = addTrailingSlashIfAbsent(path);
        const pathWithoutSlash = pathWithSlash.slice(
          0,
          pathWithSlash.length - 1,
        );

        if (allResourcePaths.has(pathWithSlash)) {
          accumulatedResult.push([pathWithSlash, attributions]);
        } else if (allResourcePaths.has(pathWithoutSlash)) {
          accumulatedResult.push([pathWithoutSlash, attributions]);
        }

        return accumulatedResult;
      },
      [],
    ),
  );
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
] satisfies Array<keyof PackageInfo>;

export function mergePackageInfos(a: PackageInfo, b: PackageInfo): PackageInfo {
  const diff: Pick<PackageInfo, (typeof HASH_EXCLUDE_KEYS)[number]> = {
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
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
  attributionsToResources: AttributionsToResources;
}): [Attributions, ResourcesToAttributions] {
  const attributionsWithResources = Object.values(
    attributions,
  ).map<PackageInfo>((attribution) => ({
    ...attribution,
    resources: sortBy(attributionsToResources[attribution.id]),
  }));

  const groups = Object.values(
    groupBy<PackageInfo>(attributionsWithResources, (attribution) =>
      objectHash(attribution, {
        excludeKeys: (key) =>
          HASH_EXCLUDE_KEYS.some((excludeKey) => excludeKey === key),
      }),
    ),
  );

  return groups.reduce<[Attributions, ResourcesToAttributions]>(
    ([attributions, resourcesToAttributions], group) => {
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
            (attributionId) =>
              !group.map(({ id }) => id).includes(attributionId),
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
  originalAttributions?: Attributions,
): Attributions {
  return Object.entries(rawAttributions).reduce<Attributions>(
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
      const originalAttribution = originalAttributions
        ? effectiveOriginIds &&
          Object.values(originalAttributions).find((attribution) =>
            attribution.originIds?.some((id) =>
              effectiveOriginIds.includes(id),
            ),
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
  attributions: Attributions,
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
          ...attribution
        },
      ],
    ) => {
      rawAttributions[attributionId] = {
        ...attribution,
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
