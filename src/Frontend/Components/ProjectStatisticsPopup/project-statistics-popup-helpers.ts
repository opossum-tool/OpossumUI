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
import { isEmpty, pickBy } from 'lodash';
import { PieChartData } from '../PieChart/PieChart';
import { OpossumColors } from '../../shared-styles';
import {
  CriticalityTypes,
  ProjectStatisticsPopupTitle,
} from '../../enums/enums';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';

export interface AttributionCountPerSourcePerLicense {
  [licenseNameOrTotal: string]: { [sourceNameOrTotal: string]: number };
}

export interface LicenseNamesWithCriticality {
  [licenseName: string]: Criticality | undefined;
}

interface UniqueLicenseNameToAttributions {
  [strippedLicenseName: string]: Array<string>;
}

export const SOURCE_TOTAL = 'Total';
export const LICENSE_TOTAL = 'Total';
export const ATTRIBUTION_TOTAL = 'Total Attributions';
export const ATTRIBUTION_PROPERTY_FOLLOW_UP = 'followUp';
export const ATTRIBUTION_PROPERTY_FIRST_PARTY = 'firstParty';
export const ATTRIBUTION_PROPERTY_INCOMPLETE = 'incomplete';
export const LICENSE_COLUMN_NAME_IN_TABLE = 'License name';
export const AMOUNT_COLUMN_NAME_IN_TABLE = 'Amount';
export const PLACEHOLDER_ATTRIBUTION_COUNT = '-';

const UNKNOWN_SOURCE_PLACEHOLDER = '-';
const ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME: {
  [attributionProperty: string]: string;
} = {
  followUp: 'Follow up',
  firstParty: 'First party',
  incomplete: 'Incomplete Attributions',
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

  attributionCountPerSourcePerLicense[LICENSE_TOTAL] = {};
  for (const licenseName of Object.keys(attributionCountPerSourcePerLicense)) {
    if (licenseName !== LICENSE_TOTAL) {
      for (const sourceName of Object.keys(
        attributionCountPerSourcePerLicense[licenseName]
      )) {
        attributionCountPerSourcePerLicense[LICENSE_TOTAL][sourceName] =
          (attributionCountPerSourcePerLicense[LICENSE_TOTAL][sourceName] ||
            0) + attributionCountPerSourcePerLicense[licenseName][sourceName];
      }
    }
  }
  if (isEmpty(licenseNamesWithCriticality)) {
    attributionCountPerSourcePerLicense[LICENSE_TOTAL][SOURCE_TOTAL] = 0;
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
    attributionCountPerSourcePerLicense[mostFrequentLicenseName][SOURCE_TOTAL] =
      Object.values(
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

      licenseCriticalityCounts[variantCriticality || 'none']++;

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
  attributions: Attributions
): {
  [attributionPropertyOrTotal: string]: number;
} {
  const attributionPropertyCounts: {
    [attributionPropertyOrTotal: string]: number;
  } = {};
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_FOLLOW_UP] = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.followUp)
  ).length;
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_FIRST_PARTY] = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.firstParty)
  ).length;
  attributionPropertyCounts[ATTRIBUTION_PROPERTY_INCOMPLETE] = Object.keys(
    pickBy(attributions, (value: PackageInfo) => isPackageInfoIncomplete(value))
  ).length;
  attributionPropertyCounts[ATTRIBUTION_TOTAL] =
    Object.values(attributions).length;

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
      property1 === ATTRIBUTION_TOTAL ? 1 : 0
    );
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export function getMostFrequentLicenses(
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense
): Array<PieChartData> {
  const mostFrequentLicenses: Array<PieChartData> = [];

  for (const license of Object.keys(attributionCountPerSourcePerLicense)) {
    if (license !== LICENSE_TOTAL) {
      mostFrequentLicenses.push({
        name: license,
        count: attributionCountPerSourcePerLicense[license][SOURCE_TOTAL],
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
      attributionCountPerSourcePerLicense[LICENSE_TOTAL][SOURCE_TOTAL];

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
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense,
  licenseNamesWithCriticality: LicenseNamesWithCriticality
): Array<PieChartData> {
  const licenseCriticalityCounts = { high: 0, medium: 0, none: 0 };

  for (const license of Object.keys(attributionCountPerSourcePerLicense)) {
    if (license !== LICENSE_TOTAL) {
      licenseCriticalityCounts[
        licenseNamesWithCriticality[license] || 'none'
      ] += attributionCountPerSourcePerLicense[license][SOURCE_TOTAL];
    }
  }

  const criticalityData = [
    {
      name: CriticalityTypes.HighCriticality,
      count: licenseCriticalityCounts['high'],
    },
    {
      name: CriticalityTypes.MediumCriticality,
      count: licenseCriticalityCounts['medium'],
    },
    {
      name: CriticalityTypes.NoCriticality,
      count: licenseCriticalityCounts['none'],
    },
  ];

  return criticalityData.filter(
    (criticalityDataWithCount) => criticalityDataWithCount['count'] !== 0
  );
}

export function getColorsForPieChart(
  pieChartData: Array<PieChartData>,
  pieChartTitle: string
): Array<string> | undefined {
  const pieChartColors = [];

  if (
    pieChartTitle === ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart
  ) {
    for (const pieChartSegment of pieChartData) {
      switch (pieChartSegment.name) {
        case CriticalityTypes.HighCriticality:
          pieChartColors.push(OpossumColors.orange);
          break;
        case CriticalityTypes.MediumCriticality:
          pieChartColors.push(OpossumColors.mediumOrange);
          break;
        default:
          pieChartColors.push(OpossumColors.darkBlue);
          break;
      }
    }
  } else {
    return;
  }
  return pieChartColors;
}

export function getIncompleteAttributionsCount(
  attributions: Attributions
): Array<PieChartData> {
  const incompleteAttributionsData: Array<PieChartData> = [];
  const numberOfAttributions = Object.keys(attributions).length;
  const numberOfIncompleteAttributions = Object.keys(
    pickBy(attributions, (value: PackageInfo) => isPackageInfoIncomplete(value))
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
