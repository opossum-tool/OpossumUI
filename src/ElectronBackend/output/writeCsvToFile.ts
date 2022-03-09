// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as csv from 'fast-csv';
import { CsvFormatterStream } from 'fast-csv';
import * as fs from 'fs';
import {
  AttributionInfo,
  Attributions,
  AttributionsWithResources,
  PackageInfo,
} from '../../shared/shared-types';
import { KeysOfAttributionInfo } from '../types/types';

const CUT_OFF_LENGTH = 30000;

export async function writeCsvToFile(
  filePath: string,
  attributionsToWrite: AttributionsWithResources | Attributions,
  columns: Array<KeysOfAttributionInfo>,
  shortenResources = false
): Promise<unknown> {
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
      csvStream
    );

    csvStream.end();
    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Error while writing the file ${filePath}. \n${error}`);
  }
}

function writeHeaders(
  columns: Array<KeysOfAttributionInfo>,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >
): void {
  const headers = getHeadersFromColumns(columns);
  csvStream.write({
    ...headers,
    attributionNumber: 'Index',
  });
}

// exported for unit testing
export function getHeadersFromColumns(columns: Array<KeysOfAttributionInfo>): {
  [key: string]: string;
} {
  const availableHeaders: { [key in KeysOfAttributionInfo]: string } = {
    packageName: 'Package Name',
    packageVersion: 'Package Version',
    packageNamespace: 'Package Namespace',
    packageType: 'Package Type',
    packagePURLAppendix: 'PURL Appendix',
    url: 'URL',
    copyright: 'Copyright',
    licenseName: 'License Name',
    licenseText: 'License Text (truncated)',
    resources: 'Resources',
    source: 'Source',
    attributionConfidence: 'Confidence',
    comment: 'Comment',
    firstParty: 'First Party',
    followUp: 'Follow-up',
    originId: 'Origin Attribution ID',
    preSelected: 'pre-selected',
    excludeFromNotice: 'exclude-from-notice',
    criticality: 'criticality',
  };

  const headers: { [key: string]: string } = {};
  for (const key of columns) {
    headers[key] = availableHeaders[key];
  }

  return headers;
}

function writeAttributionsWithResourceToCsv(
  attributionsToWrite: AttributionsWithResources | Attributions,
  columns: Array<string>,
  shortenResources = false,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >
): void {
  let attributionNumber = 0;
  Object.values(attributionsToWrite).forEach((attributionToWrite) => {
    attributionNumber = attributionNumber + 1;

    if (
      isAttributionInfo(attributionToWrite) &&
      columns.includes('resources')
    ) {
      writeAttributionWithResources(
        attributionToWrite,
        attributionNumber,
        shortenResources,
        csvStream
      );
    } else {
      writeAttribution(attributionToWrite, attributionNumber, csvStream);
    }
  });
}

function isAttributionInfo(
  attribution: AttributionInfo | PackageInfo
): attribution is AttributionInfo {
  return 'resources' in attribution;
}

function writeAttributionWithResources(
  attributionWithResource: AttributionInfo,
  attributionNumber: number,
  shortenResources = false,
  csvStream: CsvFormatterStream<
    Record<string, unknown>,
    Record<string, unknown>
  >
): void {
  const shortenedLicenseText = getShortenedLicenseText(attributionWithResource);

  if (shortenResources) {
    const shortenedResources = getShortenedResources(
      attributionWithResource.resources
    );
    csvStream.write({
      ...attributionWithResource,
      licenseText: shortenedLicenseText,
      resources: shortenedResources,
      attributionNumber,
    });
  } else {
    attributionWithResource.resources.forEach((resource) => {
      const isFirstResource =
        attributionWithResource.resources.indexOf(resource) === 0;

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
  >
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

function getShortenedResources(resources: Array<string>): string {
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
