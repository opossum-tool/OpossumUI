// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { WebContents } from 'electron';
import { IpcChannel } from '../../shared/ipc-channels';
import {
  Attributions,
  BaseUrlsForSources,
  FollowUp,
  FrequentLicences,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import {
  RawAttributions,
  RawBaseUrlsForSources,
  RawFrequentLicense,
} from '../types/types';
import { canResourceHaveChildren } from '../../Frontend/util/can-resource-have-children';

function addTrailingSlashIfAbsent(resourcePath: string): string {
  return resourcePath.endsWith('/') ? resourcePath : resourcePath.concat('/');
}

function getListOfResourcePaths(
  basePath: string,
  resourceName: string,
  resources: Resources
): Array<string> {
  const fullResourcePath =
    basePath + resourceName + (canResourceHaveChildren(resources) ? '/' : '');

  return [fullResourcePath].concat(
    Object.keys(resources)
      .map((childPath) =>
        getListOfResourcePaths(
          fullResourcePath,
          childPath,
          resources[childPath] as Resources
        )
      )
      .flat()
  );
}

export function getAllResourcePaths(resources: Resources): Set<string> {
  return new Set(getListOfResourcePaths('', '', resources));
}

export function sanitizeResourcesToAttributions(
  resources: Resources,
  rawResourcesToAttributions: ResourcesToAttributions
): ResourcesToAttributions {
  const allResourcePaths = getAllResourcePaths(resources);

  return Object.fromEntries(
    Object.entries(rawResourcesToAttributions).reduce(
      (
        accumulatedResult: Array<[string, Array<string>]>,
        [path, attributions]
      ) => {
        const pathWithSlashes = addTrailingSlashIfAbsent(path);

        if (allResourcePaths.has(path)) {
          accumulatedResult.push([path, attributions]);
        } else if (allResourcePaths.has(pathWithSlashes)) {
          accumulatedResult.push([pathWithSlashes, attributions]);
        }

        return accumulatedResult;
      },
      []
    )
  );
}

export function cleanNonExistentAttributions(
  webContents: WebContents,
  resourcesToAttributions: ResourcesToAttributions,
  attributions: Attributions
): ResourcesToAttributions {
  const attributionIds = new Set(Object.keys(attributions));

  return Object.fromEntries(
    Object.entries(resourcesToAttributions)
      .map((entry) => {
        const [path, entryAttributionIds] = entry;
        const filteredAttributionIds = entryAttributionIds.filter(
          (attributionId) => attributionIds.has(attributionId)
        );
        if (filteredAttributionIds.length < entryAttributionIds.length) {
          webContents.send(
            IpcChannel.Logging,
            `WARNING: There were abandoned attributions for path ${path}.` +
              ' The import from the attribution file was cleaned up.'
          );
        }
        return [path, filteredAttributionIds];
      })
      .filter((entry) => entry[1].length > 0)
  );
}

export function cleanNonExistentResolvedExternalSignals(
  webContents: WebContents,
  resolvedExternalAttributions: Set<string>,
  externalAttributions: Attributions
): Set<string> {
  const externalAttributionIds = new Set(Object.keys(externalAttributions));

  resolvedExternalAttributions.forEach((resolvedExternalAttributionId) => {
    if (!externalAttributionIds.has(resolvedExternalAttributionId)) {
      resolvedExternalAttributions.delete(resolvedExternalAttributionId);
      webContents.send(
        IpcChannel.Logging,
        `WARNING: There was an abandoned resolved external attribution: ${resolvedExternalAttributionId}.` +
          ' The import from the attribution file was cleaned up.'
      );
    }
  });

  return resolvedExternalAttributions;
}

export function sanitizeRawAttributions(
  rawAttributions: RawAttributions
): Attributions {
  for (const attributionId of Object.keys(rawAttributions)) {
    if (rawAttributions[attributionId]?.followUp !== FollowUp) {
      delete rawAttributions[attributionId].followUp;
    }
    if (rawAttributions[attributionId]?.comment === '') {
      delete rawAttributions[attributionId].comment;
    }
  }

  return rawAttributions as Attributions;
}

export function parseFrequentLicenses(
  rawFrequentLicenses: Array<RawFrequentLicense> | undefined
): FrequentLicences {
  const parsedFrequentLicenses: FrequentLicences = { nameOrder: [], texts: {} };
  if (!rawFrequentLicenses) {
    return parsedFrequentLicenses;
  }

  rawFrequentLicenses.forEach((rawFrequentLicense) => {
    parsedFrequentLicenses.nameOrder.push(rawFrequentLicense.shortName);
    parsedFrequentLicenses.texts[rawFrequentLicense.shortName] =
      rawFrequentLicense.defaultText;
  });

  return parsedFrequentLicenses;
}

export function sanitizeRawBaseUrlsForSources(
  rawBaseUrlsForSources: RawBaseUrlsForSources | undefined
): BaseUrlsForSources {
  return rawBaseUrlsForSources
    ? Object.fromEntries(
        Object.entries(rawBaseUrlsForSources).map(([path, url]) => {
          return [path.endsWith('/') ? path : path + '/', url];
        })
      )
    : {};
}
