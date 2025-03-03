// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy } from 'lodash';

import {
  Attributions,
  Criticality,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import { PieChartCriticalityNames } from '../../enums/enums';
import {
  AttributionCountPerSourcePerLicense,
  LicenseCounts,
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
} {
  const {
    attributionCountPerSourcePerLicense,
    totalAttributionsPerLicense,
    licenseNamesWithCriticality,
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

  return { licenseCounts, licenseNamesWithCriticality };
}

function getLicenseDataFromAttributionsAndSources(
  strippedLicenseNameToAttribution: UniqueLicenseNameToAttributions,
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  totalAttributionsPerLicense: { [licenseName: string]: number };
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
} {
  const licenseNamesWithCriticality: LicenseNamesWithCriticality = {};
  const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
    {};
  const totalAttributionsPerLicense: { [licenseName: string]: number } = {};

  for (const strippedLicenseName of Object.keys(
    strippedLicenseNameToAttribution,
  )) {
    const {
      mostFrequentLicenseName,
      licenseCriticality,
      sourcesCountForLicense,
    } = getLicenseDataFromVariants(
      strippedLicenseNameToAttribution[strippedLicenseName],
      attributions,
      attributionSources,
    );

    licenseNamesWithCriticality[mostFrequentLicenseName] = licenseCriticality;
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
  };
}

function getLicenseDataFromVariants(
  attributionIds: Array<string>,
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  mostFrequentLicenseName: string;
  licenseCriticality: Criticality;
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
  let licenseCriticality = Criticality.None;

  for (const attributionId of attributionIds) {
    const licenseName = attributions[attributionId].licenseName;
    if (licenseName) {
      licenseNameVariantsCount[licenseName] =
        (licenseNameVariantsCount[licenseName] || 0) + 1;

      const variantCriticality = attributions[attributionId].criticality;

      licenseCriticality = Math.max(licenseCriticality, variantCriticality);

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
  const mostFrequentLicenseName = Object.keys(licenseNameVariantsCount).reduce(
    (a, b) =>
      licenseNameVariantsCount[a] > licenseNameVariantsCount[b] ? a : b,
  );
  return {
    mostFrequentLicenseName,
    licenseCriticality,
    sourcesCountForLicense,
  };
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
  const licenseCriticalityCounts = {
    [Criticality.High]: 0,
    [Criticality.Medium]: 0,
    [Criticality.None]: 0,
  };

  for (const license of Object.keys(
    licenseCounts.attributionCountPerSourcePerLicense,
  )) {
    licenseCriticalityCounts[licenseNamesWithCriticality[license]] +=
      licenseCounts.totalAttributionsPerLicense[license];
  }

  const criticalityData = [
    {
      name: PieChartCriticalityNames.HighCriticality,
      count: licenseCriticalityCounts[Criticality.High],
    },
    {
      name: PieChartCriticalityNames.MediumCriticality,
      count: licenseCriticalityCounts[Criticality.Medium],
    },
    {
      name: PieChartCriticalityNames.NoCriticality,
      count: licenseCriticalityCounts[Criticality.None],
    },
  ];

  return criticalityData.filter(
    (criticalityDataWithCount) => criticalityDataWithCount['count'] !== 0,
  );
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
