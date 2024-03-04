// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, groupBy, min, sortBy } from 'lodash';
import objectHash from 'object-hash';

import { canResourceHaveChildren } from '../../Frontend/util/can-resource-have-children';
import { getModifiedPreferredState } from '../../shared/get-modified-preferred-state';
import {
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  Criticality,
  DiscreteConfidence,
  FrequentLicenses,
  PackageInfo,
  RawAttributions,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { RawFrequentLicense } from '../types/types';

function addTrailingSlashIfAbsent(resourcePath: string): string {
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
        const pathWithSlashes = addTrailingSlashIfAbsent(path);

        if (allResourcePaths.has(path)) {
          accumulatedResult.push([path, attributions]);
        } else if (allResourcePaths.has(pathWithSlashes)) {
          accumulatedResult.push([pathWithSlashes, attributions]);
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
  'preSelected',
  'wasPreferred',
] satisfies Array<keyof PackageInfo>;

export function mergePackageInfos(a: PackageInfo, b: PackageInfo): PackageInfo {
  const diff: Required<Pick<PackageInfo, (typeof HASH_EXCLUDE_KEYS)[number]>> =
    {
      attributionConfidence:
        min([a.attributionConfidence, b.attributionConfidence]) ??
        DiscreteConfidence.High,
      comment: compact([a.comment, b.comment]).join('\n\n'),
      id: a.id,
      originIds: Array.from(
        new Set([...(a.originIds ?? []), ...(b.originIds ?? [])]),
      ),
      preSelected: a.preSelected || b.preSelected || false,
      wasPreferred: a.wasPreferred || b.wasPreferred || false,
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
  mergedExternalAttributions?: Attributions,
): Attributions {
  return Object.entries(rawAttributions).reduce<Attributions>(
    (
      attributions,
      [
        attributionId,
        { followUp, comment, criticality, originId, originIds, ...attribution },
      ],
    ) => {
      const isCritical =
        !!criticality && Object.values(Criticality).includes(criticality);
      const sanitizedComment = comment?.replace(/^\s+|\s+$/g, '');
      const deserializedAttribution: PackageInfo = {
        ...attribution,
        ...((originId || originIds?.length) && {
          originIds: (originIds ?? []).concat(originId ?? []),
        }),
        ...(followUp === 'FOLLOW_UP' && { followUp: true }),
        ...(isCritical && { criticality }),
        ...(sanitizedComment && { comment: sanitizedComment }),
        id: attributionId,
      };

      const modifiedPreferredState = mergedExternalAttributions
        ? getModifiedPreferredState({
            attribution: deserializedAttribution,
            externalAttributionsList: Object.values(mergedExternalAttributions),
          })
        : undefined;
      if (modifiedPreferredState) {
        deserializedAttribution.modifiedPreferred =
          modifiedPreferredState.modifiedPreferred;
      }

      attributions[attributionId] = deserializedAttribution;

      return attributions;
    },
    {},
  );
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
          count,
          followUp,
          id,
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
