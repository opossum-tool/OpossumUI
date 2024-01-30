// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { canResourceHaveChildren } from '../../Frontend/util/can-resource-have-children';
import {
  Attributions,
  BaseUrlsForSources,
  Criticality,
  FrequentLicenses,
  RawAttributions,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import logger from '../main/logger';
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

export function cleanNonExistentAttributions(
  resourcesToAttributions: ResourcesToAttributions,
  attributions: Attributions,
): ResourcesToAttributions {
  const attributionIds = new Set(Object.keys(attributions));

  return Object.fromEntries(
    Object.entries(resourcesToAttributions)
      .map((entry) => {
        const [path, entryAttributionIds] = entry;
        const filteredAttributionIds = entryAttributionIds.filter(
          (attributionId) => attributionIds.has(attributionId),
        );
        if (filteredAttributionIds.length < entryAttributionIds.length) {
          logger.info(
            `WARNING: There were abandoned attributions for path ${path}.` +
              ' The import from the attribution file was cleaned up.',
          );
        }
        return [path, filteredAttributionIds];
      })
      .filter((entry) => entry[1].length > 0),
  );
}

export function cleanNonExistentResolvedExternalAttributions(
  resolvedExternalAttributions: Set<string>,
  externalAttributions: Attributions,
): Set<string> {
  const externalAttributionIds = new Set(Object.keys(externalAttributions));

  resolvedExternalAttributions.forEach((resolvedExternalAttributionId) => {
    if (!externalAttributionIds.has(resolvedExternalAttributionId)) {
      resolvedExternalAttributions.delete(resolvedExternalAttributionId);
      logger.info(
        `WARNING: There was an abandoned resolved external attribution: ${resolvedExternalAttributionId}.` +
          ' The import from the attribution file was cleaned up.',
      );
    }
  });

  return resolvedExternalAttributions;
}

export function deserializeAttributions(
  rawAttributions: RawAttributions,
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
      attributions[attributionId] = {
        ...attribution,
        ...((originId || originIds?.length) && {
          originIds: (originIds ?? []).concat(originId ?? []),
        }),
        ...(followUp === 'FOLLOW_UP' && { followUp: true }),
        ...(sanitizedComment && { comments: [sanitizedComment] }),
        ...(isCritical && { criticality }),
        id: attributionId,
      };
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
          comments,
          count,
          followUp,
          id,
          linkedAttributionIds,
          resources,
          source,
          suffix,
          synthetic,
          ...attribution
        },
      ],
    ) => {
      const sanitizedComments = comments
        ?.map((comment) => comment.replace(/^\s+|\s+$/g, ''))
        .filter((comment) => !!comment);
      rawAttributions[attributionId] = {
        ...attribution,
        ...(sanitizedComments?.length && {
          comment: sanitizedComments.join('\n'),
        }),
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
          return [path.endsWith('/') ? path : `${path}/`, url];
        }),
      )
    : {};
}
