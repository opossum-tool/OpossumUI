// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql, Transaction } from 'kysely';
import { DataTypeExpression } from 'kysely/dist/cjs/parser/data-type-parser';
import { snakeCase } from 'lodash';

import {
  ExternalAttributionSources,
  FrequentLicenses,
  InputFileAttributionData,
  PackageInfo,
  ParsedFileContent,
  Resources,
} from '../../shared/shared-types';
import { getDb, getRawDb, resetDb } from './db';
import { DB } from './generated/databaseTypes';

/**
 * Comments that will be added to the generated types and diagram
 */
export const comments: Record<string, Record<string, string>> = {
  attribution: {
    _table_:
      "External attributions (UI: 'signals') and manual attributions (UI: 'attributions')",
    data: 'All of the attribution as JSON',
  },
  resource: {
    name: 'The name of the root resource is the empty string',
    path: 'Without trailing slash.\nThe path of the root resource is the empty string',
    can_have_children: 'Is a directory or in files_with_children',
  },
  source_for_attribution: {
    external_attribution_source_name:
      'Mainly contains names of external_attribution_source, but can also contain unknown names',
  },
};

export async function initializeDb(inputFile: ParsedFileContent) {
  resetDb();

  await getDb()
    .transaction()
    .execute(async (trx) => {
      await initializeExternalAttributionSourceTable(
        trx,
        inputFile.externalAttributionSources,
      );

      const resourcePathToId = await initializeResourceTable(
        trx,
        inputFile.resources,
        inputFile.attributionBreakpoints,
        inputFile.filesWithChildren,
      );

      await initializeAttributionTable(
        trx,
        inputFile.externalAttributions,
        inputFile.manualAttributions,
        inputFile.resolvedExternalAttributions,
      );

      await initializeSourceForAttributionTable(
        trx,
        inputFile.externalAttributions,
      );

      await initializeResourceToAttributionTable(
        trx,
        inputFile.externalAttributions,
        inputFile.manualAttributions,
        resourcePathToId,
      );

      await initializeFrequentLicenseTable(trx, inputFile.frequentLicenses);
    });
}

async function initializeExternalAttributionSourceTable(
  trx: Transaction<DB>,
  externalAttributionSources: ExternalAttributionSources,
) {
  await trx.schema
    .createTable('external_attribution_source')
    .addColumn('name', 'text', (col) => col.primaryKey().notNull())
    .addColumn('priority', 'integer', (col) => col.notNull())
    .addColumn('is_relevant_for_preferred', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  for (const [key, source] of Object.entries(externalAttributionSources)) {
    await trx
      .insertInto('external_attribution_source')
      .values({
        name: key,
        priority: source.priority,
        is_relevant_for_preferred: Number(
          source.isRelevantForPreferred ?? false,
        ),
      })
      .execute();
  }
}

async function initializeResourceTable(
  trx: Transaction<DB>,
  resources: Resources,
  attributionBreakpoints: Set<string>,
  filesWithChildren: Set<string>,
) {
  await trx.schema
    .createTable('resource')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull())
    .addColumn('path', 'text', (col) => col.notNull().unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('parent_id', 'integer', (col) => col.references('resource.id'))
    .addColumn('is_attribution_breakpoint', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('is_file', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('can_have_children', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  const resourcePathToId = new Map<string, number>();
  let nextId = 1;

  // Prepared statement for fast bulk insert
  const rawDb = getRawDb();
  const insertStmt = rawDb.prepare(`
    INSERT INTO resource
      (id, path, name, parent_id, is_attribution_breakpoint, is_file, can_have_children)
    VALUES
      ($id, $path, $name, $parent_id, $is_attribution_breakpoint, $is_file, $can_have_children)
  `);

  function recursivelyInsertResource(
    name: string,
    children: Resources | 1,
    parentId: number | null,
    parentPath: string | null,
  ) {
    const currentPath = parentPath === null ? '' : `${parentPath}/${name}`;

    const isLeaf = children === 1;
    const isFile = isLeaf || filesWithChildren.has(currentPath);
    const isAttributionBreakpoint = attributionBreakpoints.has(currentPath);

    const resourceId = nextId++;
    insertStmt.run({
      id: resourceId,
      path: currentPath,
      name,
      parent_id: parentId,
      is_attribution_breakpoint: Number(isAttributionBreakpoint),
      is_file: Number(isFile),
      can_have_children: Number(!isLeaf),
    });

    resourcePathToId.set(currentPath, resourceId);

    if (!isLeaf) {
      for (const [childName, childChildren] of Object.entries(children)) {
        recursivelyInsertResource(
          childName,
          childChildren,
          resourceId,
          currentPath,
        );
      }
    }
  }

  // The root resource has "" as name and path
  recursivelyInsertResource('', resources, null, null);

  await trx.schema
    .createIndex('resource_parent_id_idx')
    .on('resource')
    .column('parent_id')
    .execute();

  return resourcePathToId;
}

export const generatedColumnsFromJsonData = [
  ['preSelected', 'boolean'],
  ['criticality', 'integer'],
  ['classification', 'integer'],
  ['firstParty', 'boolean'],
  ['excludeFromNotice', 'boolean'],
  ['wasPreferred', 'boolean'],
  ['copyright', 'text'],
  ['licenseName', 'text'],
  ['url', 'text'],
  ['packageName', 'text'],
  ['packageNamespace', 'text'],
  ['packageType', 'text'],
  ['attributionConfidence', 'integer'],
  ['followUp', 'boolean'],
  ['needsReview', 'boolean'],
  ['preferred', 'boolean'],
  ['originalAttributionWasPreferred', 'boolean'],
] as const satisfies Array<[keyof PackageInfo, DataTypeExpression]>;

async function initializeAttributionTable(
  trx: Transaction<DB>,
  externalAttributions: InputFileAttributionData,
  manualAttributions: InputFileAttributionData,
  resolvedExternalAttributions: Set<string>,
) {
  let schema = trx.schema
    .createTable('attribution')
    .addColumn('uuid', 'text', (col) => col.primaryKey().notNull())
    .addColumn('data', 'text', (col) => col.notNull())
    .addColumn('is_external', 'integer', (col) => col.notNull())
    .addColumn('is_resolved', 'integer', (col) => col.notNull().defaultTo(0));

  for (const [name, datatype] of generatedColumnsFromJsonData) {
    if (datatype === 'boolean') {
      schema = schema.addColumn(snakeCase(name), 'integer', (col) =>
        col
          .generatedAlwaysAs(sql.raw(`COALESCE(data ->> '${name}', 0)`))
          .stored()
          .notNull(),
      );
    } else {
      schema = schema.addColumn(snakeCase(name), datatype, (col) =>
        col.generatedAlwaysAs(sql.raw(`data ->> '${name}'`)).stored(),
      );
    }
  }

  await schema.execute();

  for (const [uuid, attribution] of Object.entries(
    externalAttributions.attributions,
  )) {
    const isResolved = resolvedExternalAttributions.has(uuid);

    await trx
      .insertInto('attribution')
      .values({
        uuid,
        data: JSON.stringify(attribution),
        is_external: Number(true),
        is_resolved: Number(isResolved),
      })
      .execute();
  }

  for (const [uuid, attribution] of Object.entries(
    manualAttributions.attributions,
  )) {
    await trx
      .insertInto('attribution')
      .values({
        uuid,
        data: JSON.stringify(attribution),
        is_external: Number(false),
        is_resolved: Number(false),
      })
      .execute();
  }

  for (const [name, _] of generatedColumnsFromJsonData) {
    await trx.schema
      .createIndex(`attribution_${snakeCase(name)}_idx`)
      .on('attribution')
      .column('is_external')
      .column(snakeCase(name))
      .execute();
  }
}

async function initializeSourceForAttributionTable(
  trx: Transaction<DB>,
  externalAttributions: InputFileAttributionData,
) {
  await trx.schema
    .createTable('source_for_attribution')
    .addColumn('attribution_uuid', 'text', (col) =>
      col.primaryKey().notNull().references('attribution.uuid'),
    )
    // Not a foreign key to external_attribution_source.name because we have some attributions that have a
    .addColumn('external_attribution_source_name', 'text', (col) =>
      col.notNull(),
    )
    .addColumn('document_confidence', 'integer')
    .addColumn('additional_name', 'text')
    .execute();

  for (const [uuid, attribution] of Object.entries(
    externalAttributions.attributions,
  )) {
    if (attribution.source) {
      await trx
        .insertInto('source_for_attribution')
        .values({
          attribution_uuid: uuid,
          external_attribution_source_name: attribution.source.name,
          document_confidence: attribution.source.documentConfidence,
          additional_name: attribution.source.additionalName,
        })
        .execute();
    }
  }

  await trx.schema
    .createIndex('source_for_attribution_source_name_idx')
    .on('source_for_attribution')
    .column('external_attribution_source_name')
    .execute();
}

async function initializeResourceToAttributionTable(
  trx: Transaction<DB>,
  externalAttributions: InputFileAttributionData,
  manualAttributions: InputFileAttributionData,
  resourcePathToId: Map<string, number>,
) {
  await trx.schema
    .createTable('resource_to_attribution')
    .addColumn('resource_id', 'integer', (col) =>
      col.notNull().references('resource.id'),
    )
    .addColumn('attribution_uuid', 'text', (col) =>
      col.notNull().references('attribution.uuid').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('resource_to_attribution_pk', [
      'resource_id',
      'attribution_uuid',
    ])
    .execute();

  // Prepared statement for fast bulk insert
  const rawDb = getRawDb();
  const insertStmt = rawDb.prepare(`
    INSERT OR IGNORE INTO resource_to_attribution
      (resource_id, attribution_uuid)
    VALUES
      ($resource_id, $attribution_uuid)
  `);

  for (const [resourcePath, attributionUuids] of [
    ...Object.entries(externalAttributions.resourcesToAttributions),
    ...Object.entries(manualAttributions.resourcesToAttributions),
  ]) {
    const normalizedPath = resourcePath.replace(/\/$/, '') || '/';
    const resourceId = resourcePathToId.get(normalizedPath);
    if (resourceId === undefined) {
      continue;
    }

    for (const uuid of attributionUuids) {
      insertStmt.run({ resource_id: resourceId, attribution_uuid: uuid });
    }
  }

  await trx.schema
    .createIndex('resource_to_attribution_resource_id_idx')
    .on('resource_to_attribution')
    .column('resource_id')
    .execute();

  await trx.schema
    .createIndex('resource_to_attribution_attribution_uuid_idx')
    .on('resource_to_attribution')
    .column('attribution_uuid')
    .execute();
}

async function initializeFrequentLicenseTable(
  trx: Transaction<DB>,
  frequentLicenses: FrequentLicenses,
) {
  await trx.schema
    .createTable('frequent_license')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull())
    .addColumn('short_name', 'text', (col) => col.notNull())
    .addColumn('full_name', 'text', (col) => col.notNull())
    .addColumn('license_text', 'text')
    .execute();

  for (const license of frequentLicenses.nameOrder) {
    const licenseText = frequentLicenses.texts[license.shortName] ?? null;

    await trx
      .insertInto('frequent_license')
      .values({
        short_name: license.shortName,
        full_name: license.fullName,
        license_text: licenseText,
      })
      .execute();
  }

  await trx.schema
    .createIndex('frequent_license_short_name_idx')
    .on('frequent_license')
    .column('short_name')
    .execute();

  await trx.schema
    .createIndex('frequent_license_full_name_idx')
    .on('frequent_license')
    .column('full_name')
    .execute();
}
