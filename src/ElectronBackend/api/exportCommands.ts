// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import {
  type Attributions,
  ExportType,
  type PackageInfo,
} from '../../shared/shared-types';
import { getDb } from '../db/db';
import { writeCsvToFile } from '../output/writeCsvToFile';
import { writeSpdxFile } from '../output/writeSpdxFile';

export async function exportFile(exportType: ExportType, filePath: string) {
  switch (exportType) {
    case ExportType.FollowUp:
      await exportFollowUp({ filePath });
      break;
    case ExportType.CompactBom:
      await exportCompactBom({ filePath });
      break;
    case ExportType.DetailedBom:
      await exportDetailedBom({ filePath });
      break;
    case ExportType.SpdxDocumentJson:
    case ExportType.SpdxDocumentYaml:
      await exportSpdxDocument({
        type: exportType,
        filePath,
      });
      break;
  }
}

async function exportFollowUp(params: { filePath: string }) {
  const followUpAndFilePathsResult = await getDb()
    .selectFrom('attribution')
    .select([
      'uuid',
      'data',
      (eb) =>
        eb
          .selectFrom('resource')
          .innerJoin('cwa', 'cwa.resource_id', 'resource.id')
          .innerJoin(
            'resource_to_attribution',
            'resource_to_attribution.resource_id',
            'cwa.manual',
          )
          .select(
            sql<string>`json_group_array(resource.path ORDER BY resource.sort_key)`.as(
              'paths',
            ),
          )
          .whereRef('attribution_uuid', '=', 'uuid')
          .where('resource.is_file', '=', 1)
          .as('paths'),
    ])
    .where('is_external', '=', 0)
    .where('follow_up', '=', 1)
    .execute();

  const followUpAttributions: Attributions = Object.fromEntries(
    followUpAndFilePathsResult.map((row) => [
      row.uuid,
      {
        ...(JSON.parse(row.data) as PackageInfo),
        resources: JSON.parse(row.paths ?? '[]') as Array<string>,
      },
    ]),
  );

  await writeCsvToFile({
    path: params.filePath,
    attributions: followUpAttributions,
    columns: [
      'packageName',
      'packageVersion',
      'url',
      'copyright',
      'licenseName',
      'resources',
    ],
    shortenResources: true,
  });
}

async function exportSpdxDocument(params: {
  type: ExportType.SpdxDocumentJson | ExportType.SpdxDocumentYaml;
  filePath: string;
}) {
  const rows = await getDb()
    .selectFrom('attribution')
    .leftJoin(
      'frequent_license',
      'frequent_license.full_name',
      'attribution.license_name',
    )
    .select([
      'attribution.uuid',
      'attribution.package_name',
      'attribution.data',
      'frequent_license.license_text as frequent_license_text',
    ])
    .where('is_external', '=', 0)
    .orderBy('attribution.package_name')
    .execute();

  const spdxAttributions: Attributions = {};
  for (const row of rows) {
    const packageInfo = JSON.parse(row.data) as PackageInfo;
    const licenseText =
      packageInfo.licenseText ?? row.frequent_license_text ?? '';
    spdxAttributions[row.uuid] = { ...packageInfo, licenseText };
  }
  writeSpdxFile({
    path: params.filePath,
    type: params.type,
    attributions: spdxAttributions,
  });
}

async function exportCompactBom(params: { filePath: string }) {
  const rows = await getDb()
    .selectFrom('attribution')
    .select(['uuid', 'data'])
    .where('is_external', '=', 0)
    .where('follow_up', '=', 0)
    .where('first_party', '=', 0)
    .where('exclude_from_notice', '=', 0)
    .execute();

  const bomAttributions: Attributions = Object.fromEntries(
    rows.map((row) => [row.uuid, JSON.parse(row.data) as PackageInfo]),
  );

  await writeCsvToFile({
    path: params.filePath,
    attributions: bomAttributions,
    columns: [
      'packageName',
      'packageVersion',
      'licenseName',
      'copyright',
      'url',
    ],
  });
}

async function exportDetailedBom(params: { filePath: string }) {
  const manualAttributionsAndResourcesResult = await getDb()
    .selectFrom('attribution')
    .select([
      'uuid',
      'data',
      (eb) =>
        eb
          .selectFrom('resource')
          .innerJoin(
            'resource_to_attribution',
            'resource_to_attribution.resource_id',
            'resource.id',
          )
          .select(
            sql<string>`json_group_array(resource.path ORDER BY resource.sort_key)`.as(
              'paths',
            ),
          )
          .whereRef('attribution_uuid', '=', 'uuid')
          .as('paths'),
    ])
    .where('is_external', '=', 0)
    .where('follow_up', '=', 0)
    .where('first_party', '=', 0)
    .execute();

  const bomAttributions: Attributions = Object.fromEntries(
    manualAttributionsAndResourcesResult.map((row) => [
      row.uuid,
      {
        ...(JSON.parse(row.data) as PackageInfo),
        resources: JSON.parse(row.paths ?? '[]') as Array<string>,
      },
    ]),
  );

  await writeCsvToFile({
    path: params.filePath,
    attributions: bomAttributions,
    columns: [
      'packageName',
      'packageVersion',
      'packageNamespace',
      'packageType',
      'packagePURLAppendix',
      'url',
      'copyright',
      'licenseName',
      'licenseText',
      'resources',
    ],
  });
}
