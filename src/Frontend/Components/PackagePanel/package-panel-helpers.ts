// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DisplayPackageInfo,
  ExternalAttributionSources,
  PackageInfo,
  Source,
} from '../../../shared/shared-types';
import { getPackageInfoKeys } from '../../../shared/shared-util';
import { AttributionIdWithCount } from '../../types/types';
import { shouldNotBeCalled } from '../../util/should-not-be-called';

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
  const { knownSources, unknownSources } = sources.reduce(
    (
      encounteredSources: {
        knownSources: Array<string>;
        unknownSources: Array<string>;
      },
      source: string
    ) => {
      if (attributionSources.hasOwnProperty(source)) {
        encounteredSources.knownSources.push(source);
      } else {
        encounteredSources.unknownSources.push(source);
      }
      return encounteredSources;
    },
    { knownSources: [], unknownSources: [] }
  );

  const sortedKnownSources = knownSources.sort((sourceA, sourceB) => {
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
  });

  return sortedKnownSources.concat(unknownSources.sort());
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

export function convertDisplayPackageInfoToPackageInfo(
  displayPackageInfo: DisplayPackageInfo
): PackageInfo {
  const packageInfo: PackageInfo = {};

  getPackageInfoKeys().forEach((packageInfoKey) => {
    if (packageInfoKey in displayPackageInfo) {
      switch (packageInfoKey) {
        case 'packageName':
        case 'packageVersion':
        case 'packageNamespace':
        case 'packageType':
        case 'packagePURLAppendix':
        case 'url':
        case 'copyright':
        case 'licenseName':
        case 'licenseText':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'comment':
          break;
        case 'firstParty':
        case 'preSelected':
        case 'needsReview':
        case 'excludeFromNotice':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'attributionConfidence':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'followUp':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'source':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'originIds':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        case 'criticality':
          packageInfo[packageInfoKey] = displayPackageInfo[packageInfoKey];
          break;
        default:
          shouldNotBeCalled(packageInfoKey);
      }
    }
    if (
      displayPackageInfo.attributionIds.length === 1 &&
      displayPackageInfo.comments
    ) {
      packageInfo.comment = displayPackageInfo.comments[0];
    }
  });

  return packageInfo;
}
