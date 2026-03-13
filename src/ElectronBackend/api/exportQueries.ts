// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import {
  Attributions,
  ExportType,
  PackageInfo,
} from '../../shared/shared-types';
import { getDb } from '../db/db';
import { getGlobalBackendState } from '../main/globalBackendState';
import { writeCsvToFile } from '../output/writeCsvToFile';
import { writeSpdxFile } from '../output/writeSpdxFile';

export async function exportFollowUp() {
  const db = getDb();
  const globalState = getGlobalBackendState();
  if (!globalState.followUpFilePath) {
    throw new Error('Follow-up file path is not set');
  }

  const all = await db
    .selectFrom('attribution')
    .select([
      'uuid',
      'data',
      // get paths of files that have inherited manual attributions that need follow-up
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
    all.map((row) => [
      row.uuid,
      {
        ...(JSON.parse(row.data) as PackageInfo),
        resources: JSON.parse(row.paths ?? '[]') as Array<string>,
      },
    ]),
  );

  await writeCsvToFile(
    globalState.followUpFilePath,
    followUpAttributions,
    [
      'packageName',
      'packageVersion',
      'url',
      'copyright',
      'licenseName',
      'resources',
    ],
    true,
  );
  return { result: null };
}

export async function exportSpdxDocument(params: {
  type: ExportType.SpdxDocumentJson | ExportType.SpdxDocumentYaml;
}) {
  const globalState = getGlobalBackendState();
  const filePath =
    params.type === ExportType.SpdxDocumentJson
      ? globalState.spdxJsonFilePath
      : globalState.spdxYamlFilePath;
  if (!filePath) {
    throw new Error(
      `SPDX ${params.type === ExportType.SpdxDocumentJson ? 'JSON' : 'YAML'} file path is not set`,
    );
  }

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
    // Previously the code was only getting the frequent license text because of a bug, now we default to packageInfo.licenseText
    const licenseText =
      packageInfo.licenseText ?? row.frequent_license_text ?? '';
    spdxAttributions[row.uuid] = { ...packageInfo, licenseText };
  }

  writeSpdxFile(filePath, { type: params.type, spdxAttributions });

  return { result: null };
}

export async function exportCompactBom() {
  const db = getDb();
  const globalState = getGlobalBackendState();
  if (!globalState.compactBomFilePath) {
    throw new Error('Compact BOM file path is not set');
  }

  const rows = await db
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

  await writeCsvToFile(globalState.compactBomFilePath, bomAttributions, [
    'packageName',
    'packageVersion',
    'licenseName',
    'copyright',
    'url',
  ]);

  return { result: null };
}

export async function exportDetailedBom() {
  const db = getDb();
  const globalState = getGlobalBackendState();
  if (!globalState.detailedBomFilePath) {
    throw new Error('Detailed BOM file path is not set');
  }

  const all = await db
    .selectFrom('attribution')
    .select([
      'uuid',
      'data',
      // get paths of resources directly associated with bom attributions
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
    all.map((row) => [
      row.uuid,
      {
        ...(JSON.parse(row.data) as PackageInfo),
        resources: JSON.parse(row.paths ?? '[]') as Array<string>,
      },
    ]),
  );

  await writeCsvToFile(globalState.detailedBomFilePath, bomAttributions, [
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
  ]);

  return { result: null };
}
