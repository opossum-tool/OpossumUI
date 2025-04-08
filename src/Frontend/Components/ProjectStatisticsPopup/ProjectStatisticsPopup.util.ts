// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { toNumber } from 'lodash';

import {
  Attributions,
  Classification,
  ClassificationsConfig,
  Criticality,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  AttributionCountPerSourcePerLicense,
  ChartDataItem,
  LicenseCounts,
  LicenseNamesWithClassification,
  LicenseNamesWithCriticality,
} from '../../types/types';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';

interface UniqueLicenseNameToAttributions {
  [strippedLicenseName: string]: Array<string>;
}

const UNKNOWN_SOURCE_PLACEHOLDER = '-';

export const CRITICALITY_LABEL: Record<Criticality, string> = {
  [Criticality.High]:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
      .highlyCritical,
  [Criticality.Medium]:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
      .mediumCritical,
  [Criticality.None]:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.nonCritical,
};

export function aggregateLicensesAndSourcesFromAttributions(
  attributions: Attributions,
  attributionSources: ExternalAttributionSources,
): {
  licenseCounts: LicenseCounts;
  licenseNamesWithCriticality: LicenseNamesWithCriticality;
  licenseNamesWithClassification: LicenseNamesWithClassification;
} {
  const strippedLicenseNameToAttribution =
    getUniqueLicenseNameToAttribution(attributions);
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
  licenseCriticality: Criticality;
  licenseClassification: Classification | undefined;
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

  let licenseClassification: Classification | undefined = undefined;

  for (const attributionId of attributionIds) {
    const licenseName = attributions[attributionId].licenseName;
    if (licenseName) {
      licenseNameVariantsCount[licenseName] =
        (licenseNameVariantsCount[licenseName] || 0) + 1;

      const variantCriticality = attributions[attributionId].criticality;

      licenseCriticality = Math.max(licenseCriticality, variantCriticality);

      const variantClassification = attributions[attributionId].classification;

      if (licenseClassification === undefined) {
        licenseClassification = variantClassification;
      } else if (variantClassification !== undefined) {
        licenseClassification = Math.max(
          licenseClassification,
          variantClassification,
        );
      }

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
    licenseClassification,
    sourcesCountForLicense,
  };
}

function getUniqueLicenseNameToAttribution(
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

export function getStrippedLicenseName(licenseName: string): string {
  return licenseName.replace(/[\s-]/g, '').toLowerCase();
}

export function aggregateAttributionPropertiesFromAttributions(
  attributions: Attributions,
): Array<ChartDataItem> {
  const attributionPropertyText =
    text.projectStatisticsPopup.charts.attributionProperties;

  const countAttributionsWhere: (
    predicate: (value: PackageInfo) => boolean | undefined,
  ) => number = (predicate) =>
    Object.values(attributions).filter(predicate).length;

  return [
    {
      name: attributionPropertyText.needsReview,
      count: countAttributionsWhere((attribution) => attribution.needsReview),
    },
    {
      name: attributionPropertyText.followUp,
      count: countAttributionsWhere((attribution) => attribution.followUp),
    },
    {
      name: attributionPropertyText.firstParty,
      count: countAttributionsWhere((attribution) => attribution.firstParty),
    },
    {
      name: attributionPropertyText.incomplete,
      count: countAttributionsWhere(isPackageInfoIncomplete),
    },
    {
      name: attributionPropertyText.total,
      count: Object.values(attributions).length,
    },
  ];
}

export function getMostFrequentLicenses(
  licenseCounts: LicenseCounts,
): Array<ChartDataItem> {
  const numberOfDisplayedLicenses = 5;
  const mostFrequentLicenses: Array<ChartDataItem> = [];

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
): Array<ChartDataItem> {
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
      name: CRITICALITY_LABEL[Criticality.High],
      count: licenseCriticalityCounts[Criticality.High],
    },
    {
      name: CRITICALITY_LABEL[Criticality.Medium],
      count: licenseCriticalityCounts[Criticality.Medium],
    },
    {
      name: CRITICALITY_LABEL[Criticality.None],
      count: licenseCriticalityCounts[Criticality.None],
    },
  ];

  return criticalityData.filter(({ count }) => count > 0);
}

type ColoredChartDataItem = ChartDataItem & { color: string };

export function getSignalCountByClassification(
  licenseCounts: LicenseCounts,
  licenseNamesWithClassification: LicenseNamesWithClassification,
  classifications: ClassificationsConfig,
): [Array<ChartDataItem>, { [segmentName: string]: string }] {
  const classificationCounts: Record<Classification, number> = {};

  for (const [license, attributionCount] of Object.entries(
    licenseCounts.totalAttributionsPerLicense,
  )) {
    const classification = licenseNamesWithClassification[license];
    if (classification === undefined) {
      continue;
    }
    classificationCounts[classification] =
      (classificationCounts[classification] ?? 0) + attributionCount;
  }

  const pieChartData = Object.keys(classifications)
    .map(Number)
    .map<ColoredChartDataItem>((classification) => {
      const classificationName = classifications[classification].description;
      const classificationCount =
        classificationCounts[toNumber(classification)] ?? 0;
      const color = classifications[classification].color;

      return {
        name: classificationName,
        count: classificationCount,
        color,
      };
    })
    .filter(({ count }) => count > 0);

  const colorMap = Object.fromEntries(
    pieChartData.map((colorChartEntry) => [
      colorChartEntry.name,
      colorChartEntry.color,
    ]),
  );

  return [pieChartData, colorMap];
}

export function getIncompleteAttributionsCount(
  attributions: Attributions,
): Array<ChartDataItem> {
  const incompleteAttributionsData: Array<ChartDataItem> = [];
  const numberOfAttributions = Object.keys(attributions).length;
  const numberOfIncompleteAttributions = Object.values(attributions).filter(
    isPackageInfoIncomplete,
  ).length;

  if (numberOfAttributions - numberOfIncompleteAttributions !== 0) {
    incompleteAttributionsData.push({
      name: text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
        .completeAttributions,
      count: numberOfAttributions - numberOfIncompleteAttributions,
    });
  }
  if (numberOfIncompleteAttributions !== 0) {
    incompleteAttributionsData.push({
      name: text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
        .incompleteAttributions,
      count: numberOfIncompleteAttributions,
    });
  }
  return incompleteAttributionsData;
}
