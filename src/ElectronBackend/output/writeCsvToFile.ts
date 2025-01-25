// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as csv from 'fast-csv';
import { CsvFormatterStream } from 'fast-csv';
import * as fs from 'fs';
import { pick } from 'lodash';

import { Attributions, PackageInfo } from '../../shared/shared-types';

export const CUT_OFF_LENGTH = 30000;

export async function writeCsvToFile(
  filePath: string,
  attributionsToWrite: Attributions,
  columns: Array<keyof PackageInfo>,
  shortenResources = false,
): Promise<void> {
  try {
    const writeStream = fs.createWriteStream(filePath);
    const csvStream = csv.format({
      headers: ['attributionNumber'].concat(columns),
      writeHeaders: false,
      delimiter: ';',
      quoteColumns: true,
    });

    csvStream.pipe(writeStream).on('end', () => process.exit());

    writeHeaders(columns, csvStream);

    writeAttributionsWithResourceToCsv(
      attributionsToWrite,
      columns,
      shortenResources,
      csvStream,
    );

    csvStream.end();
    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  } catch (error) {
    throw new Error(
      `Error while writing the file ${filePath}. \n${error?.toString()}`,
    );
  }
}

function writeHeaders(
  columns: Array<keyof PackageInfo>,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >,
): void {
  const headers = getHeadersFromColumns(columns);
  csvStream.write({
    ...headers,
    attributionNumber: 'Index',
  });
}

// exported for unit testing
export function getHeadersFromColumns(columns: Array<keyof PackageInfo>): {
  [key: string]: string;
} {
  const availableHeaders: { [key in keyof PackageInfo]: string } = {
    attributionConfidence: 'Confidence',
    comment: 'Comment',
    copyright: 'Copyright',
    count: 'Count',
    criticality: 'criticality',
    synthetic: 'Synthetic',
    excludeFromNotice: 'exclude-from-notice',
    firstParty: 'First Party',
    followUp: 'Follow-up',
    id: 'ID',
    licenseName: 'License Name',
    licenseText: 'License Text (truncated)',
    needsReview: 'needs-review',
    originIds: 'Origin Attribution IDs',
    packageName: 'Package Name',
    packageNamespace: 'Package Namespace',
    packagePURLAppendix: 'PURL Appendix',
    packageType: 'Package Type',
    packageVersion: 'Package Version',
    preSelected: 'pre-selected',
    preferred: 'preferred',
    preferredOverOriginIds: 'preferred-over-origin-ids',
    resources: 'Resources',
    source: 'Source',
    suffix: 'Suffix',
    url: 'URL',
    wasPreferred: 'was-preferred',
  };

  return pick(availableHeaders, columns);
}

function writeAttributionsWithResourceToCsv(
  attributionsToWrite: Attributions,
  columns: Array<string>,
  shortenResources = false,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >,
): void {
  let attributionNumber = 0;
  Object.values(attributionsToWrite).forEach((attributionToWrite) => {
    attributionNumber = attributionNumber + 1;

    if (columns.includes('resources')) {
      writeAttributionWithResources(
        attributionToWrite,
        attributionNumber,
        shortenResources,
        csvStream,
      );
    } else {
      writeAttribution(attributionToWrite, attributionNumber, csvStream);
    }
  });
}

function writeAttributionWithResources(
  attributionWithResource: PackageInfo,
  attributionNumber: number,
  shortenResources = false,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >,
): void {
  const shortenedLicenseText = getShortenedLicenseText(attributionWithResource);

  if (shortenResources) {
    const shortenedResources = getShortenedResources(
      attributionWithResource.resources,
    );
    csvStream.write({
      ...attributionWithResource,
      licenseText: shortenedLicenseText,
      resources: shortenedResources,
      attributionNumber,
    });
  } else {
    attributionWithResource.resources?.forEach((resource) => {
      const isFirstResource =
        attributionWithResource.resources?.indexOf(resource) === 0;

      if (isFirstResource) {
        csvStream.write({
          ...attributionWithResource,
          licenseText: shortenedLicenseText,
          resources: resource,
          attributionNumber,
        });
      } else {
        csvStream.write({
          resources: resource,
          attributionNumber,
        });
      }
    });
  }
}

function writeAttribution(
  attributionWithResource: PackageInfo,
  attributionNumber: number,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >,
): void {
  const shortenedLicenseText = getShortenedLicenseText(attributionWithResource);

  csvStream.write({
    ...attributionWithResource,
    licenseText: shortenedLicenseText,
    attributionNumber,
  });
}

function getShortenedLicenseText(attributionWithResource: PackageInfo): string {
  const postFix = '... (text shortened)';

  return attributionWithResource.licenseText
    ? attributionWithResource.licenseText.length < CUT_OFF_LENGTH
      ? attributionWithResource.licenseText
      : attributionWithResource.licenseText.substring(0, CUT_OFF_LENGTH) +
        postFix
    : '';
}

function getShortenedResources(resources: Array<string> | undefined): string {
  if (!resources) {
    return '';
  }

  if (resources.length === 1) {
    return resources[0];
  }

  let shortenedResources = '';
  while (shortenedResources.length <= CUT_OFF_LENGTH && resources.length) {
    shortenedResources =
      shortenedResources + (shortenedResources ? '\n' : '') + resources.shift();
  }
  const postFix = resources.length
    ? ` ... (resources shortened, ${resources.length} paths are not displayed)`
    : '';

  return shortenedResources + postFix;
}
