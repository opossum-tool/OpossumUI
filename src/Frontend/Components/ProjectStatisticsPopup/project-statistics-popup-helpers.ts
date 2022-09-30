// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  Criticality,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import { isEmpty } from 'lodash';

export interface AttributionCountPerSourcePerLicense {
  [licenseNameOrTotal: string]: { [sourceNameOrTotal: string]: number };
}

export interface LicenseNamesWithCriticality {
  [licenseName: string]: Criticality | undefined;
}

interface UniqueLicenseNameToAttributions {
  [strippedLicenseName: string]: Array<string>;
}
export interface PieChartData {
  licenseName: string;
  count: number;
}

const ATTRIBUTION_PROPERTIES_TO_DISPLAY: Array<keyof PackageInfo> = [
  'followUp',
  'firstParty',
];
export const SOURCE_TOTAL_Key = 'Total';
export const LICENSE_TOTAL_Key = 'Total';
export const ATTRIBUTION_TOTAL_Key = 'Total Attributions';
export const LICENSE_COLUMN_NAME_IN_TABLE_Key = 'License';
export const TOTAL_COLUMN_NAME_IN_TABLE_Key = 'Total';
export const PLACEHOLDER_ATTRIBUTION_COUNT = '-';

const UNKNOWN_SOURCE_PLACEHOLDER = '-';
const ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME: {
  [attributionProperty: string]: string;
} = {
  followUp: 'Follow up',
  firstParty: 'First party',
};

export function aggregateLicensesAndSourcesFromAttributions(
  attributions: Attributions,
  strippedLicenseNameToAttribution: UniqueLicenseNameToAttributions,
  attributionSources: ExternalAttributionSources
): {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
} {
  const { attributionCountPerSourcePerLicense, licenseNamesWithCriticality } =
    getLicenseDataFromAttributionsAndSources(
      strippedLicenseNameToAttribution,
      attributions,
      attributionSources
    );

  attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key] = {};
  for (const licenseName of Object.keys(attributionCountPerSourcePerLicense)) {
    if (licenseName !== LICENSE_TOTAL_Key) {
      for (const sourceName of Object.keys(
        attributionCountPerSourcePerLicense[licenseName]
      )) {
        attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key][sourceName] =
          (attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key][sourceName] ||
            0) + attributionCountPerSourcePerLicense[licenseName][sourceName];
      }
    }
  }
  if (isEmpty(licenseNamesWithCriticality)) {
    attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key][
      SOURCE_TOTAL_Key
    ] = 0;
  }
  return { attributionCountPerSourcePerLicense, licenseNamesWithCriticality };
}

function getLicenseDataFromAttributionsAndSources(
  strippedLicenseNameToAttribution: UniqueLicenseNameToAttributions,
  attributions: Attributions,
  attributionSources: ExternalAttributionSources
): {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
} {
  const licenseNamesWithCriticality: LicenseNamesWithCriticality = {};
  const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
    {};

  for (const strippedLicenseName of Object.keys(
    strippedLicenseNameToAttribution
  )) {
    const {
      mostFrequentLicenseName,
      licenseCriticality,
      sourcesCountForLicense,
    } = getLicenseDataFromVariants(
      strippedLicenseNameToAttribution[strippedLicenseName],
      attributions,
      attributionSources
    );

    licenseNamesWithCriticality[mostFrequentLicenseName] = licenseCriticality;
    attributionCountPerSourcePerLicense[mostFrequentLicenseName] =
      sourcesCountForLicense;
    attributionCountPerSourcePerLicense[mostFrequentLicenseName][
      SOURCE_TOTAL_Key
    ] = Object.values(
      attributionCountPerSourcePerLicense[mostFrequentLicenseName]
    ).reduce((total, value) => {
      return total + value;
    });
  }
  return { attributionCountPerSourcePerLicense, licenseNamesWithCriticality };
}

function getLicenseDataFromVariants(
  attributionIds: Array<string>,
  attributions: Attributions,
  attributionSources: ExternalAttributionSources
): {
  mostFrequentLicenseName: string;
  licenseCriticality: Criticality | undefined;
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

  for (const attributionId of attributionIds) {
    const licenseName = attributions[attributionId].licenseName;
    if (licenseName) {
      licenseNameVariantsCount[licenseName] =
        (licenseNameVariantsCount[licenseName] || 0) + 1;

      const variantCriticality = attributions[attributionId].criticality;

      if (variantCriticality === Criticality.High) {
        licenseCriticalityCounts['high']++;
      } else if (variantCriticality === Criticality.Medium) {
        licenseCriticalityCounts['medium']++;
      } else {
        licenseCriticalityCounts['none']++;
      }

      const sourceName = getSourceDisplayNameFromId(
        attributions[attributionId].source?.name ?? UNKNOWN_SOURCE_PLACEHOLDER,
        attributionSources
      );

      sourcesCountForLicense[sourceName] =
        (sourcesCountForLicense[sourceName] || 0) + 1;
    }
  }
  const licenseCriticality = getLicenseCriticality(licenseCriticalityCounts);
  const mostFrequentLicenseName = Object.keys(licenseNameVariantsCount).reduce(
    (a, b) =>
      licenseNameVariantsCount[a] > licenseNameVariantsCount[b] ? a : b
  );
  return {
    mostFrequentLicenseName,
    licenseCriticality,
    sourcesCountForLicense,
  };
}

function getLicenseCriticality(licenseCriticalityCounts: {
  high: number;
  medium: number;
  none: number;
}): Criticality | undefined {
  return licenseCriticalityCounts['medium'] + licenseCriticalityCounts['high'] >
    licenseCriticalityCounts['none']
    ? licenseCriticalityCounts['high']
      ? Criticality.High
      : Criticality.Medium
    : undefined;
}

function getSourceDisplayNameFromId(
  sourceId: string,
  externalAttributionSources: ExternalAttributionSources
): string {
  if (
    Object.keys(externalAttributionSources).includes(sourceId) &&
    sourceId !== UNKNOWN_SOURCE_PLACEHOLDER
  ) {
    return externalAttributionSources[sourceId]['name'];
  }
  return sourceId;
}

export function getUniqueLicenseNameToAttribution(
  attributions: Attributions
): UniqueLicenseNameToAttributions {
  const uniqueLicenseNameToAttributions: UniqueLicenseNameToAttributions = {};
  for (const attributionId of Object.keys(attributions)) {
    const licenseName = attributions[attributionId].licenseName;
    if (licenseName) {
      const strippedLicenseName = licenseName
        .replace(/[\s-]/g, '')
        .toLowerCase();
      if (!uniqueLicenseNameToAttributions[strippedLicenseName]) {
        uniqueLicenseNameToAttributions[strippedLicenseName] = [];
      }
      uniqueLicenseNameToAttributions[strippedLicenseName].push(attributionId);
    }
  }
  return uniqueLicenseNameToAttributions;
}

export function aggregateAttributionPropertiesFromAttributions(
  attributionValues: Array<PackageInfo>
): {
  [attributionPropertyOrTotal: string]: number;
} {
  const attributionPropertyCounts: {
    [attributionPropertyOrTotal: string]: number;
  } = {};
  for (const attributionProperty of ATTRIBUTION_PROPERTIES_TO_DISPLAY) {
    attributionPropertyCounts[attributionProperty] = 0;
  }

  for (const attribution of attributionValues) {
    for (const attributionProperty of ATTRIBUTION_PROPERTIES_TO_DISPLAY) {
      if (attribution[attributionProperty]) {
        attributionPropertyCounts[attributionProperty]++;
      }
    }
  }

  attributionPropertyCounts[ATTRIBUTION_TOTAL_Key] = attributionValues.length;

  return attributionPropertyCounts;
}

export function getAttributionPropertyDisplayNameFromId(
  attributionProperty: string
): string {
  if (attributionProperty in ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME) {
    return ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME[attributionProperty];
  }
  return attributionProperty;
}

export function sortAttributionPropertiesEntries(
  attributionPropertiesOrTotalEntries: Array<Array<string | number>>
): Array<Array<string | number>> {
  // Move ATTRIBUTION_TOTAL to the end of the list
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return attributionPropertiesOrTotalEntries
    .slice()
    .sort(([property1, _count1], [_property2, _count2]) =>
      property1 === ATTRIBUTION_TOTAL_Key ? 1 : 0
    );
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export function getMostFrequentLicenses(
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense
): Array<PieChartData> {
  const mostFrequentLicenses: Array<PieChartData> = [];

  for (const license of Object.keys(attributionCountPerSourcePerLicense)) {
    if (license !== LICENSE_TOTAL_Key) {
      mostFrequentLicenses.push({
        licenseName: license,
        count: attributionCountPerSourcePerLicense[license][SOURCE_TOTAL_Key],
      });
    }
  }
  const sortedMostFrequentLicenses = mostFrequentLicenses.sort(
    (a, b) => b.count - a.count
  );

  if (sortedMostFrequentLicenses.length > 5) {
    const sortedTopFiveFrequentLicensesAndOther =
      sortedMostFrequentLicenses.slice(0, 5);

    const total =
      attributionCountPerSourcePerLicense[LICENSE_TOTAL_Key][SOURCE_TOTAL_Key];

    const sumTopFiveFrequentLicensesCount =
      sortedTopFiveFrequentLicensesAndOther.reduce((accumulator, object) => {
        return accumulator + object.count;
      }, 0);

    const other = total - sumTopFiveFrequentLicensesCount;

    sortedTopFiveFrequentLicensesAndOther.push({
      licenseName: 'Other',
      count: other,
    });
    return sortedTopFiveFrequentLicensesAndOther;
  }
  return sortedMostFrequentLicenses;
}
