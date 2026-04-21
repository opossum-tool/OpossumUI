// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql, type Transaction } from 'kysely';
import { snakeCase } from 'lodash';

import {
  type BaseUrlsForSources,
  type ExternalAttributionSources,
  type FrequentLicenses,
  type InputFileAttributionData,
  type PackageInfo,
  type ParsedFileContent,
  type Resources,
  type ResourcesToAttributions,
} from '../../shared/shared-types';
import { removeTrailingSlash, toCanonicalLicenseName } from '../api/utils';
import { getDb, getRawDb, resetDb } from './db';
import { type DB } from './generated/databaseTypes';

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
    max_descendant_id:
      'The highest id of a descendant of this resource. As the resources are numbered depth-first, this enables us to identify the children of resource R by checking if child.id is between R.id and R.max_descendant_id, which is very fast. See https://en.wikipedia.org/wiki/Nested_set_model',
  },
  source_for_attribution: {
    external_attribution_source_key:
      'Mainly contains keys of external_attribution_source, but can also contain unknown values',
  },
  resource_to_attribution: {
    attribution_is_external:
      'Denormalized data for faster checking if a resource has manual/external attribution',
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
        inputFile.baseUrlsForSources,
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

      await initializeProgressBarTable(trx);
    });
}

async function initializeProgressBarTable(trx: Transaction<DB>) {
  await trx.schema
    .createTable('closest_attributed_ancestors')
    .addColumn('resource_id', 'integer', (col) =>
      col.primaryKey().notNull().references('resource.id'),
    )
    .addColumn('is_file', 'integer', (col) => col.notNull())
    .addColumn('breakpoint', 'integer', (col) =>
      col.notNull().references('resource.id'),
    )
    .addColumn('manual', 'integer', (col) => col.references('resource.id'))
    .addColumn('external', 'integer', (col) => col.references('resource.id'))
    .execute();

  await sql`
  INSERT INTO closest_attributed_ancestors WITH RECURSIVE 
  has_manual_attribution AS MATERIALIZED (
    SELECT DISTINCT resource_id
    FROM resource_to_attribution
    WHERE attribution_is_external = 0
  ),
  has_unresolved_external_attribution AS MATERIALIZED (
    SELECT DISTINCT resource_id
    FROM resource_to_attribution
    WHERE attribution_uuid IN (SELECT uuid FROM attribution WHERE is_external = 1 AND is_resolved = 0)
  ),
  closest_attributed_ancestors(resource_id, parent_id, is_file, breakpoint, manual, external) AS (
    SELECT r.id, r.parent_id, r.is_file, r.id,
    IIF(r.id IN has_manual_attribution, r.id, NULL),
    IIF(r.id IN has_unresolved_external_attribution, r.id, NULL)
    FROM resource as r
    WHERE path = ''

    UNION ALL
    
    SELECT child.id, child.parent_id, child.is_file,
    IIF(child.is_attribution_breakpoint, child.id, parent.breakpoint),
    IIF(child.id IN has_manual_attribution, child.id, 
        IIF(child.is_attribution_breakpoint, NULL, parent.manual)
    ),
    IIF(child.id IN has_unresolved_external_attribution, child.id, 
        IIF(child.is_attribution_breakpoint, NULL, parent.external)
    )
    FROM resource as child
    JOIN closest_attributed_ancestors as parent ON child.parent_id = parent.resource_id
  )
  SELECT resource_id, is_file, breakpoint, manual, external FROM closest_attributed_ancestors
  `.execute(trx);

  await trx.schema
    .createIndex('closest_attributed_ancestors_manual_idx')
    .on('closest_attributed_ancestors')
    .columns(['manual', 'is_file', 'resource_id'])
    .execute();
  await trx.schema
    .createIndex('closest_attributed_ancestors_external')
    .on('closest_attributed_ancestors')
    .columns(['external', 'resource_id'])
    .execute();
  await trx.schema
    .createIndex('closest_attributed_ancestors_external_per_file')
    .on('closest_attributed_ancestors')
    .columns(['external', 'is_file', 'resource_id'])
    .execute();
  await trx.schema
    .createIndex('closest_attributed_ancestors_manual_and_external')
    .on('closest_attributed_ancestors')
    .columns(['manual', 'external', 'is_file', 'resource_id'])
    .execute();
  await trx.schema
    .createIndex('closest_attributed_ancestors_resource')
    .on('closest_attributed_ancestors')
    .columns(['resource_id', 'manual'])
    .execute();

  await trx.schema
    .createIndex('closest_attributed_ancestors_breakpoint')
    .on('closest_attributed_ancestors')
    .columns(['breakpoint', 'manual', 'resource_id'])
    .execute();
}

async function initializeExternalAttributionSourceTable(
  trx: Transaction<DB>,
  externalAttributionSources: ExternalAttributionSources,
) {
  await trx.schema
    .createTable('external_attribution_source')
    .addColumn('key', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('priority', 'integer', (col) => col.notNull())
    .addColumn('is_relevant_for_preferred', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  for (const [key, source] of Object.entries(externalAttributionSources)) {
    await trx
      .insertInto('external_attribution_source')
      .values({
        key,
        name: source.name,
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
  baseUrlsForSources: BaseUrlsForSources,
) {
  const trimmedAttributionBreakpoints = new Set(
    [...attributionBreakpoints].map(removeTrailingSlash),
  );
  const trimmedFilesWithChildren = new Set(
    [...filesWithChildren].map(removeTrailingSlash),
  );
  const trimmedBaseUrlsForSources: BaseUrlsForSources = Object.fromEntries(
    Object.entries(baseUrlsForSources).map(([path, url]) => [
      removeTrailingSlash(path),
      url,
    ]),
  );
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
    .addColumn('max_descendant_id', 'integer', (col) => col.notNull())
    .addColumn('base_url', 'text')
    .execute();

  const resourcePathToId = new Map<string, number>();
  let nextId = 1;

  // Prepared statement for fast bulk insert
  const rawDb = getRawDb();
  const insertStmt = rawDb.prepare(`
    INSERT INTO resource
      (id, path, name, parent_id, is_attribution_breakpoint, is_file, can_have_children, base_url, max_descendant_id)
    VALUES
      ($id, $path, $name, $parent_id, $is_attribution_breakpoint, $is_file, $can_have_children, $base_url, $max_descendant_id)
  `);
  type ResourceRow = {
    id: number;
    path: string;
    name: string;
    parent_id: number | null;
    is_attribution_breakpoint: number;
    is_file: number;
    can_have_children: number;
    base_url: string | null;
    max_descendant_id: number;
  };
  // Inserting many rows in a single transaction increases the speed slightly
  const insertMany = rawDb.transaction((resources: Array<ResourceRow>) => {
    for (const resource of resources) {
      insertStmt.run(resource);
    }
  });

  const resourceNameCollator = new Intl.Collator('en', {
    sensitivity: 'variant',
    caseFirst: 'lower',
  });

  function sortChildren(
    aIsFile: boolean,
    aName: string,
    bIsFile: boolean,
    bName: string,
  ) {
    if (aIsFile && !bIsFile) {
      return 1;
    }
    if (!aIsFile && bIsFile) {
      return -1;
    }
    // If both resources are files or both are directories, we sort them alphabetically
    const result = resourceNameCollator.compare(aName, bName);
    if (result !== 0) {
      return result;
    }
    return aName < bName ? -1 : aName > bName ? 1 : 0;
  }

  function recursivelyCollectResource(
    name: string,
    children: Resources | 1,
    parentId: number | null,
    parentPath: string | null,
    result: Array<ResourceRow>,
  ): number {
    const resourceId = nextId++;
    const currentPath = parentPath === null ? '' : `${parentPath}/${name}`;
    const isLeaf = children === 1;
    const isFile = isLeaf || trimmedFilesWithChildren.has(currentPath);
    const isAttributionBreakpoint =
      trimmedAttributionBreakpoints.has(currentPath);

    resourcePathToId.set(currentPath, resourceId);

    let lastDescendantId = resourceId;
    if (!isLeaf) {
      const entries = Object.entries(children).map(
        ([childName, childChildren]) => ({
          name: childName,
          children: childChildren,
          isFile:
            childChildren === 1 ||
            trimmedFilesWithChildren.has(`${currentPath}/${childName}`),
        }),
      );
      entries.sort((a, b) => sortChildren(a.isFile, a.name, b.isFile, b.name));
      for (const { name, children } of entries) {
        lastDescendantId = recursivelyCollectResource(
          name,
          children,
          resourceId,
          currentPath,
          result,
        );
      }
    }
    result[resourceId - 1] = {
      id: resourceId,
      path: currentPath,
      name,
      parent_id: parentId,
      is_attribution_breakpoint: Number(isAttributionBreakpoint),
      is_file: Number(isFile),
      can_have_children: Number(!isLeaf),
      base_url: trimmedBaseUrlsForSources[currentPath],
      max_descendant_id: lastDescendantId,
    };
    return lastDescendantId;
  }

  const resourcesToInsert: Array<ResourceRow> = [];
  // The root resource has '' as name and path
  recursivelyCollectResource('', resources, null, null, resourcesToInsert);
  insertMany(resourcesToInsert);

  await trx.schema
    .createIndex('resource_parent_id_covering_idx')
    .on('resource')
    .columns(['parent_id', 'id', 'is_file', 'is_attribution_breakpoint'])
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
  ['packageVersion', 'text'],
  ['packageType', 'text'],
  ['attributionConfidence', 'integer'],
  ['followUp', 'boolean'],
  ['needsReview', 'boolean'],
  ['preferred', 'boolean'],
  ['originalAttributionWasPreferred', 'boolean'],
  ['comment', 'text'],
] as const satisfies Array<[keyof PackageInfo, string]>;

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

  schema = schema.addColumn('canonical_license_name', 'text', (col) =>
    col.generatedAlwaysAs(toCanonicalLicenseName(sql`license_name`)).stored(),
  );

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

  for (const [name, _] of [
    ...generatedColumnsFromJsonData,
    ['canonicalLicenseName', 'text'],
  ]) {
    await trx.schema
      .createIndex(`attribution_${snakeCase(name)}_idx`)
      .on('attribution')
      .column('is_external')
      .column(snakeCase(name))
      .execute();
  }

  // Index needed for the progress bar data query
  await trx.schema
    .createIndex('attribution_is_resolved_covering_idx')
    .on('attribution')
    .columns([
      'uuid',
      'is_resolved',
      'is_external',
      'pre_selected',
      'criticality',
      'classification',
    ])
    .where('is_resolved', '=', 0)
    .execute();

  await trx.schema
    .createIndex('attribution_is_external_covering_idx')
    .on('attribution')
    .columns(['is_external', 'is_resolved'])
    .where('is_external', '=', 1)
    .where('is_resolved', '=', 0)
    .execute();
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
    // Not a foreign key to external_attribution_source.key because we have some attributions that have an unknown key
    .addColumn('external_attribution_source_key', 'text', (col) =>
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
          external_attribution_source_key: attribution.source.name,
          document_confidence: attribution.source.documentConfidence,
          additional_name: attribution.source.additionalName,
        })
        .execute();
    }
  }

  await trx.schema
    .createIndex('source_for_attribution_source_key_idx')
    .on('source_for_attribution')
    .column('external_attribution_source_key')
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
    .addColumn('attribution_is_external', 'integer', (col) => col.notNull()) // Denormalization for faster lookups
    .addPrimaryKeyConstraint('resource_to_attribution_pk', [
      'resource_id',
      'attribution_uuid',
    ])
    .execute();

  const rawDb = getRawDb();
  function insertRows(
    rows: {
      resource_id: number;
      attribution_uuid: string;
    }[],
    attribution_is_external: 0 | 1,
  ) {
    const singleValuesSql = `(?, ?, ${attribution_is_external})`;
    const multipleValuesSql =
      `${singleValuesSql}, `.repeat(rows.length - 1) + singleValuesSql;
    const stmt = rawDb.prepare(`
      INSERT OR IGNORE INTO resource_to_attribution 
      (resource_id, attribution_uuid, attribution_is_external)
      VALUES ${multipleValuesSql}
      `);
    const params = rows.flatMap((row) => [
      row.resource_id,
      row.attribution_uuid,
    ]);
    stmt.run(...params);
  }

  // SQLite cannot handle more than 30000 parameters, and since we insert an id and a uuid, we can only insert 15000 rows at a time
  const BATCH_SIZE = 15_000;
  const insertMany = rawDb.transaction(
    (resourcesToAttributions: ResourcesToAttributions, is_external: 0 | 1) => {
      const rows = Object.entries(resourcesToAttributions).flatMap(
        ([resourcePath, attributionUuids]) => {
          const resourceId = resourcePathToId.get(
            removeTrailingSlash(resourcePath),
          );
          return resourceId === undefined
            ? []
            : attributionUuids.map((uuid) => ({
                resource_id: resourceId,
                attribution_uuid: uuid,
              }));
        },
      );

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        insertRows(rows.slice(i, i + BATCH_SIZE), is_external);
      }
    },
  );

  insertMany(externalAttributions.resourcesToAttributions, 1);
  insertMany(manualAttributions.resourcesToAttributions, 0);

  await trx.schema
    .createIndex('resource_to_attribution_attribution_uuid_resource_id_idx')
    .on('resource_to_attribution')
    .column('attribution_uuid')
    .column('resource_id')
    .execute();

  await trx.schema
    .createIndex(
      'resource_to_attribution_attribution_is_external_resource_id_idx',
    )
    .on('resource_to_attribution')
    .column('attribution_is_external')
    .column('resource_id')
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
