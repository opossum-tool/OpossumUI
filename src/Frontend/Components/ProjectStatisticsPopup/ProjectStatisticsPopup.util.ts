// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy, toNumber } from 'lodash';

import {
  Attributions,
  Classifications,
  Criticality,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import { PieChartCriticalityNames } from '../../enums/enums';
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

const ATTRIBUTION_PROPERTY_NEEDS_REVIEW = 'needsReview';
const ATTRIBUTION_PROPERTY_FOLLOW_UP = 'followUp';
const ATTRIBUTION_PROPERTY_FIRST_PARTY = 'firstParty';
const ATTRIBUTION_PROPERTY_INCOMPLETE = 'incomplete';
const UNKNOWN_SOURCE_PLACEHOLDER = '-';

// exported only for tests
export const ATTRIBUTION_TOTAL = 'Total Attributions';

export function aggregateLicensesAndSourcesFromAttributions(
  attributions: Attributions,
  strippedLicenseNameToAttribution: UniqueLicenseNameToAttributions,
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
    strippedLicenseNameToAttribution,
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
  strippedLicenseNameToAttribution: UniqueLicenseNameToAttributions,
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  totalAttributionsPerLicense: { [licenseName: string]: number };
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
} {
  const licenseNamesWithCriticality: LicenseNamesWithCriticality = {};
  const licenseNamesWithClassification: LicenseNamesWithClassification = {};
  const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
    {};
  const totalAttributionsPerLicense: { [licenseName: string]: number } = {};

  for (const strippedLicenseName of Object.keys(
    strippedLicenseNameToAttribution,
  )) {
    const {
      mostFrequentLicenseName,
      licenseCriticality,
      licenseClassification,
      sourcesCountForLicense,
    } = getLicenseDataFromVariants(
      strippedLicenseNameToAttribution[strippedLicenseName],
      attributions,
      attributionSources,
    );

    licenseNamesWithCriticality[mostFrequentLicenseName] = licenseCriticality;
    licenseNamesWithClassification[mostFrequentLicenseName] =
      licenseClassification;
    attributionCountPerSourcePerLicense[mostFrequentLicenseName] =
      sourcesCountForLicense;
    totalAttributionsPerLicense[mostFrequentLicenseName] = Object.values(
      attributionCountPerSourcePerLicense[mostFrequentLicenseName],
    ).reduce((total, value) => {
      return total + value;
    });
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
  const uniqueLicenseNameToAttributions: UniqueLicenseNameToAttributions = {};
  for (const attributionId of Object.keys(attributions)) {
    const licenseName = attributions[attributionId].licenseName;
    if (licenseName) {
      const strippedLicenseName = getStrippedLicenseName(licenseName);
      if (!uniqueLicenseNameToAttributions[strippedLicenseName]) {
        uniqueLicenseNameToAttributions[strippedLicenseName] = [];
      }
      uniqueLicenseNameToAttributions[strippedLicenseName].push(attributionId);
    }
  }
  return uniqueLicenseNameToAttributions;
}

export function getLicenseNameVariants(
  licenseName: string,
  attributions: Attributions,
): Set<string> {
  const strippedLicenseName = getStrippedLicenseName(licenseName);
  const licenseNames: Set<string> = new Set<string>();

  for (const attributionId of Object.keys(attributions)) {
    const attributionLicenseName =
      attributions[attributionId].licenseName || '';
    const attributionStrippedLicenseName = getStrippedLicenseName(
      attributions[attributionId].licenseName || '',
    );

    if (attributionStrippedLicenseName === strippedLicenseName) {
      licenseNames.add(attributionLicenseName);
    }
  }

  return licenseNames;
}

export function getStrippedLicenseName(licenseName: string): string {
  return licenseName.replace(/[\s-]/g, '').toLowerCase();
}

export function aggregateAttributionPropertiesFromAttributions(
  attributions: Attributions,
): {
  [attributionPropertyOrTotal: string]: number;
} {
  const attributionPropertyCounts: {
    [attributionPropertyOrTotal: string]: number;
  } = {};
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_NEEDS_REVIEW] = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.needsReview),
  ).length;
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_FOLLOW_UP] = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.followUp),
  ).length;
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_FIRST_PARTY] = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.firstParty),
  ).length;
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_INCOMPLETE] = Object.keys(
    pickBy(attributions, (value: PackageInfo) =>
      isPackageInfoIncomplete(value),
    ),
  ).length;
  // We expect Total Attributions to always be the last entry in the returned value
  attributionPropertyCounts[ATTRIBUTION_TOTAL] =
    Object.values(attributions).length;

  return attributionPropertyCounts;
}

export function getMostFrequentLicenses(
  licenseCounts: LicenseCounts,
): Array<PieChartData> {
  const numberOfDisplayedLicenses = 5;
  const mostFrequentLicenses: Array<PieChartData> = [];

  for (const license of Object.keys(
    licenseCounts.attributionCountPerSourcePerLicense,
  )) {
    mostFrequentLicenses.push({
      name: license,
      count: licenseCounts.totalAttributionsPerLicense[license],
    });
  }
  const sortedMostFrequentLicenses = mostFrequentLicenses.sort(
    (a, b) => b.count - a.count,
  );

  if (sortedMostFrequentLicenses.length > numberOfDisplayedLicenses) {
    const sortedTopFiveFrequentLicensesAndOther =
      sortedMostFrequentLicenses.slice(0, numberOfDisplayedLicenses);

    const total = Object.values(
      licenseCounts.totalAttributionsPerSource,
    ).reduce((partialSum, num) => partialSum + num, 0);

    const sumTopFiveFrequentLicensesCount =
      sortedTopFiveFrequentLicensesAndOther.reduce((accumulator, object) => {
        return accumulator + object.count;
      }, 0);

    const other = total - sumTopFiveFrequentLicensesCount;

    sortedTopFiveFrequentLicensesAndOther.push({
      name: 'Other',
      count: other,
    });
    return sortedTopFiveFrequentLicensesAndOther;
  }
  return sortedMostFrequentLicenses;
}

export function getCriticalSignalsCount(
  licenseCounts: LicenseCounts,
  licenseNamesWithCriticality: LicenseNamesWithCriticality,
): Array<PieChartData> {
  const licenseCriticalityCounts = { high: 0, medium: 0, none: 0 };

  for (const license of Object.keys(
    licenseCounts.attributionCountPerSourcePerLicense,
  )) {
    licenseCriticalityCounts[licenseNamesWithCriticality[license] || 'none'] +=
      licenseCounts.totalAttributionsPerLicense[license];
  }

  const criticalityData = [
    {
      name: PieChartCriticalityNames.HighCriticality,
      count: licenseCriticalityCounts['high'],
    },
    {
      name: PieChartCriticalityNames.MediumCriticality,
      count: licenseCriticalityCounts['medium'],
    },
    {
      name: PieChartCriticalityNames.NoCriticality,
      count: licenseCriticalityCounts['none'],
    },
  ];

  return criticalityData.filter(({ count }) => count > 0);
}

export function getSignalCountByClassification(
  licenseCounts: LicenseCounts,
  licenseNamesWithClassification: LicenseNamesWithClassification,
  classifications: Classifications,
): Array<PieChartData> {
  const classificationCounts: { [classification: number]: number } = {};

  for (const [license, attributionCount] of Object.entries(
    licenseCounts.totalAttributionsPerLicense,
  )) {
    // count undefined classification at index -1 in classificationCounts
    const classification = licenseNamesWithClassification[license] ?? -1;
    classificationCounts[classification] =
      (classificationCounts[classification] ?? 0) + attributionCount;
  }

  const pieChartData = Object.keys(classifications)
    .map((classification) => {
      const classificationName = classifications[toNumber(classification)];
      const classificationCount =
        classificationCounts[toNumber(classification)] ?? 0;

      return {
        name: classificationName,
        count: classificationCount,
      };
    })
    .filter(({ count }) => count > 0);

  if (classificationCounts[-1]) {
    return pieChartData.concat({
      name: 'No Classification',
      count: classificationCounts[-1],
    });
  }

  return pieChartData;
}

export function getIncompleteAttributionsCount(
  attributions: Attributions,
): Array<PieChartData> {
  const incompleteAttributionsData: Array<PieChartData> = [];
  const numberOfAttributions = Object.keys(attributions).length;
  const numberOfIncompleteAttributions = Object.keys(
    pickBy(attributions, (value: PackageInfo) =>
      isPackageInfoIncomplete(value),
    ),
  ).length;

  if (numberOfAttributions - numberOfIncompleteAttributions !== 0) {
    incompleteAttributionsData.push({
      name: 'Complete attributions',
      count: numberOfAttributions - numberOfIncompleteAttributions,
    });
  }
  if (numberOfIncompleteAttributions !== 0) {
    incompleteAttributionsData.push({
      name: 'Incomplete attributions',
      count: numberOfIncompleteAttributions,
    });
  }
  return incompleteAttributionsData;
}
