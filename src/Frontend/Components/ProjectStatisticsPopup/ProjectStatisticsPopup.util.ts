// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Dictionary, groupBy, maxBy, sum } from 'lodash';

import {
  Attributions,
  Criticality,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import {
  AttributionCountPerSourcePerLicense,
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
  PieChartData,
} from '../../types/types';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';

interface UniqueLicenseNameToAttributions {
  [strippedLicenseName: string]: Array<string>;
}

const UNKNOWN_SOURCE_PLACEHOLDER = '-';

// exported only for tests
export const ATTRIBUTION_TOTAL = 'Total Attributions';

export interface AttributionStatistics {
  licenseName: string;
  criticality: Criticality | undefined;
  classification: number;
  sourceName?: string;
  isIncomplete: boolean;
  needsReview: boolean;
  followUp: boolean;
  firstParty: boolean;
}

function getSourceName(
  package_info: PackageInfo,
  attributionSources: ExternalAttributionSources,
) {
  const sourceId = package_info.source?.name ?? UNKNOWN_SOURCE_PLACEHOLDER;
  return Object.keys(attributionSources).includes(sourceId) &&
    sourceId !== UNKNOWN_SOURCE_PLACEHOLDER
    ? attributionSources[sourceId]['name']
    : sourceId;
}

export function prepareStatistics(
  attributions: Attributions,
  attributionSources?: ExternalAttributionSources,
): Array<AttributionStatistics> {
  return Object.values(attributions)
    .filter((package_info) => !!package_info.licenseName)
    .map((package_info) => {
      return {
        licenseName: package_info.licenseName as string,
        criticality: package_info.criticality,
        classification: package_info.classification ?? -1,
        sourceName: attributionSources
          ? getSourceName(package_info, attributionSources)
          : undefined,
        isIncomplete: isPackageInfoIncomplete(package_info),
        needsReview: package_info.needsReview,
        followUp: package_info.followUp,
        firstParty: package_info.firstParty,
      } as AttributionStatistics;
    });
}

export function getMostFrequentLicenses(
  stats: Array<AttributionStatistics>,
  limitDisplayed?: number,
): Array<PieChartData> {
  const licenseGroups = groupBy(
    stats.filter(({ licenseName }) => !!licenseName),
    ({ licenseName }) => getStrippedLicenseName(licenseName),
  );
  const licensesWithCount = Object.values(licenseGroups).map((group) => {
    return {
      name: maxBy(group, 'licenseName')?.licenseName,
      count: group.length,
    } as PieChartData;
  });
  if (!limitDisplayed || licensesWithCount.length <= limitDisplayed + 1) {
    return licensesWithCount;
  }
  // sort ascending
  const sortedLicensesWithCount = licensesWithCount.sort(
    ({ count: c1 }, { count: c2 }) => c2 - c1,
  );
  const mostFrequentLicenses = sortedLicensesWithCount.slice(0, limitDisplayed);
  mostFrequentLicenses.push({
    name: 'Other',
    count: sortedLicensesWithCount
      .slice(limitDisplayed)
      .reduce((total, { count }) => total + count, 0),
  });
  return mostFrequentLicenses;
}

export function convertToPieChartData(
  data: Dictionary<number>,
): Array<PieChartData> {
  return Object.entries(data).map(([key, value]) => {
    return {
      name: key,
      count: value,
    } as PieChartData;
  });
}

export function aggregateLicensesAndSourcesFromAttributions(
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
} {
  const {
    attributionCountPerSourcePerLicense,
    totalAttributionsPerLicense,
    licenseNamesWithCriticality,
    licenseNamesWithClassification,
  } = getLicenseDataFromAttributionsAndSources(
    attributions,
    attributionSources,
  );

  const totalAttributionsPerSource: { [sourceName: string]: number } = {};
  for (const licenseName of Object.keys(attributionCountPerSourcePerLicense)) {
    for (const sourceName of Object.keys(
      attributionCountPerSourcePerLicense[licenseName],
    )) {
      totalAttributionsPerSource[sourceName] =
        (totalAttributionsPerSource[sourceName] || 0) +
        attributionCountPerSourcePerLicense[licenseName][sourceName];
    }
  }

  const licenseCounts: LicenseCounts = {
    attributionCountPerSourcePerLicense,
    totalAttributionsPerLicense,
    totalAttributionsPerSource,
  };

  return {
    licenseCounts,
    licenseNamesWithCriticality,
    licenseNamesWithClassification,
  };
}

function getLicenseDataFromAttributionsAndSources(
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  totalAttributionsPerLicense: { [licenseName: string]: number };
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
} {
  const strippedLicenseNameToAttribution =
    getUniqueLicenseNameToAttribution(attributions);
  const licenseNamesWithCriticality: LicenseNamesWithCriticality = {};
  const licenseNamesWithClassification: LicenseNamesWithClassification = {};
  const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
    {};
  const totalAttributionsPerLicense: { [licenseName: string]: number } = {};

  for (const groupedAttributionIds of Object.values(
    strippedLicenseNameToAttribution,
  )) {
    const {
      mostFrequentLicenseName,
      licenseCriticality,
      licenseClassification,
      sourcesCountForLicense,
    } = getLicenseDataFromVariants(
      groupedAttributionIds,
      attributions,
      attributionSources,
    );

    licenseNamesWithCriticality[mostFrequentLicenseName] = licenseCriticality;
    licenseNamesWithClassification[mostFrequentLicenseName] =
      licenseClassification;
    attributionCountPerSourcePerLicense[mostFrequentLicenseName] =
      sourcesCountForLicense;
    totalAttributionsPerLicense[mostFrequentLicenseName] = sum(
      Object.values(sourcesCountForLicense),
    );
  }

  return {
    attributionCountPerSourcePerLicense,
    totalAttributionsPerLicense,
    licenseNamesWithCriticality,
    licenseNamesWithClassification,
  };
}

function getLicenseDataFromVariants(
  attributionIds: Array<string>,
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  mostFrequentLicenseName: string;
  licenseCriticality: Criticality | undefined;
  licenseClassification: number | undefined;
  sourcesCountForLicense: {
    [sourceNameOrTotal: string]: number;
  };
} {
  const licenseNameVariantsCount: {
    [licenseNameVariant: string]: number;
  } = {};
  const sourcesCountForLicense: {
    [sourceNameOrTotal: string]: number;
  } = {};
  const licenseCriticalityCounts = { high: 0, medium: 0, none: 0 };

  let licenseClassification: number | undefined = undefined;

  for (const attributionId of attributionIds) {
    const licenseName = attributions[attributionId].licenseName;
    if (licenseName) {
      licenseNameVariantsCount[licenseName] =
        (licenseNameVariantsCount[licenseName] || 0) + 1;

      const variantCriticality = attributions[attributionId].criticality;
      const variantClassification = attributions[attributionId].classification;

      if (licenseClassification === undefined) {
        licenseClassification = variantClassification;
      } else if (variantClassification !== undefined) {
        licenseClassification = Math.max(
          licenseClassification,
          attributions[attributionId].classification ?? 0,
        );
      }

      licenseCriticalityCounts[variantCriticality || 'none']++;

      const sourceId =
        attributions[attributionId].source?.name ?? UNKNOWN_SOURCE_PLACEHOLDER;
      const sourceName =
        Object.keys(attributionSources).includes(sourceId) &&
        sourceId !== UNKNOWN_SOURCE_PLACEHOLDER
          ? attributionSources[sourceId]['name']
          : sourceId;

      sourcesCountForLicense[sourceName] =
        (sourcesCountForLicense[sourceName] || 0) + 1;
    }
  }
  const licenseCriticality = getLicenseCriticality(licenseCriticalityCounts);
  const mostFrequentLicenseName = Object.keys(licenseNameVariantsCount).reduce(
    (a, b) =>
      licenseNameVariantsCount[a] > licenseNameVariantsCount[b] ? a : b,
  );
  return {
    mostFrequentLicenseName,
    licenseCriticality,
    licenseClassification,
    sourcesCountForLicense,
  };
}

// right now getLicenseCriticality is being exported only to be tested
export function getLicenseCriticality(licenseCriticalityCounts: {
  high: number;
  medium: number;
  none: number;
}): Criticality | undefined {
  return licenseCriticalityCounts['high'] > 0
    ? Criticality.High
    : licenseCriticalityCounts['medium'] > 0
      ? Criticality.Medium
      : undefined;
}

export function getUniqueLicenseNameToAttribution(
  attributions: Attributions,
): UniqueLicenseNameToAttributions {
  return groupBy(
    Object.keys(attributions).filter(
      (attributionId) => attributions[attributionId].licenseName !== undefined,
    ),
    (attributionId) =>
      getStrippedLicenseName(attributions[attributionId].licenseName as string),
  );
}

export function getStrippedLicenseName(licenseName: string): string {
  return licenseName.replace(/[\s-]/g, '').toLowerCase();
}
