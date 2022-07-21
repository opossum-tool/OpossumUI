// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';

export interface AttributionCountPerSourcePerLicense {
  [licenseNameOrTotal: string]: { [sourceNameOrTotal: string]: number };
}

export interface AttributionPropertyCounts {
  [attributionPropertyOrTotal: string]: number;
}

const ATTRIBUTION_PROPERTIES_TO_DISPLAY: Array<keyof PackageInfo> = [
  'followUp',
  'firstParty',
];
export const SOURCE_TOTAL_HEADER = 'Total';
export const LICENSE_TOTAL_HEADER = 'Total';
export const ATTRIBUTION_TOTAL_HEADER = 'Total Attributions';
const UNKNOWN_SOURCE_PLACEHOLDER = '-';
const ATTRIBUTION_PROPERTIES_ID_TO_DISPLAY_NAME: {
  [attributionProperty: string]: string;
} = {
  followUp: 'Follow up',
  firstParty: 'First party',
};

export function aggregateLicensesAndSourcesFromAttributions(
  attributionValues: Array<PackageInfo>,
  attributionSources: ExternalAttributionSources
): [AttributionCountPerSourcePerLicense, Array<string>] {
  const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
    {};

  for (const attribution of attributionValues) {
    const licenseName = attribution.licenseName;
    if (licenseName) {
      const sourceName = getSourceDisplayNameFromId(
        attribution.source?.name ?? UNKNOWN_SOURCE_PLACEHOLDER,
        attributionSources
      );
      const sourcesCountForLicense =
        attributionCountPerSourcePerLicense[licenseName] ?? {};
      sourcesCountForLicense[sourceName] =
        (sourcesCountForLicense[sourceName] || 0) + 1;
      attributionCountPerSourcePerLicense[licenseName] = sourcesCountForLicense;
    }
  }

  for (const licenseName of Object.keys(attributionCountPerSourcePerLicense)) {
    attributionCountPerSourcePerLicense[licenseName][SOURCE_TOTAL_HEADER] =
      Object.values(attributionCountPerSourcePerLicense[licenseName]).reduce(
        (total, value) => {
          return total + value;
        }
      );
  }

  const licenseNames: Array<string> = Object.keys(
    attributionCountPerSourcePerLicense
  );

  attributionCountPerSourcePerLicense[LICENSE_TOTAL_HEADER] = {};
  for (const licenseName of Object.keys(attributionCountPerSourcePerLicense)) {
    if (licenseName !== LICENSE_TOTAL_HEADER) {
      for (const sourceName of Object.keys(
        attributionCountPerSourcePerLicense[licenseName]
      )) {
        attributionCountPerSourcePerLicense[LICENSE_TOTAL_HEADER][sourceName] =
          (attributionCountPerSourcePerLicense[LICENSE_TOTAL_HEADER][
            sourceName
          ] || 0) +
          attributionCountPerSourcePerLicense[licenseName][sourceName];
      }
    }
  }
  if (licenseNames.length === 0) {
    attributionCountPerSourcePerLicense[LICENSE_TOTAL_HEADER][
      SOURCE_TOTAL_HEADER
    ] = 0;
  }

  return [attributionCountPerSourcePerLicense, licenseNames];
}

export function aggregateAttributionPropertiesFromAttributions(
  attributionValues: Array<PackageInfo>
): AttributionPropertyCounts {
  const attributionPropertyCounts: AttributionPropertyCounts = {};
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

  attributionPropertyCounts[ATTRIBUTION_TOTAL_HEADER] =
    attributionValues.length;

  return attributionPropertyCounts;
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
      property1 === ATTRIBUTION_TOTAL_HEADER ? 1 : 0
    );
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
