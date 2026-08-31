// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Compilable,
  expressionBuilder,
  type Insertable,
  type ReferenceExpression,
  sql,
  type Transaction,
} from 'kysely';

import {
  type BaseUrlsForSources,
  Criticality,
  type ExternalAttributionSources,
  type FrequentLicenses,
  type InputFileAttributionData,
  type ParsedFileContent,
  type ProjectMetadata,
  type RawClassificationsConfig,
  type ReadonlyRule,
  type Resources,
  type ResourcesToAttributions,
} from '../../shared/shared-types';
import { removeTrailingSlash, toCanonicalLicenseName } from '../api/utils';
import {
  ATTRIBUTION_RESOURCE_ACCESS_VALUES,
  AttributionResourceAccess,
} from '../types/types';
import { getAttributionPersistenceValues } from './attributionData';
import { getDb, getRawDb, resetDb } from './db';
import type {
  Attribution,
  DB,
  SourceForAttribution,
} from './generated/databaseTypes';

type CompleteInsertRow<Table> = Required<Insertable<Table>>;
type AttributionInsertRow = Omit<
  CompleteInsertRow<Attribution>,
  'canonical_license_name' | 'resource_access'
>;
type SourceForAttributionInsertRow = CompleteInsertRow<SourceForAttribution>;

type SqliteInsertValue = null | number | string;

function createPreparedInserter<Row extends Record<string, SqliteInsertValue>>(
  buildQuery: (row: Row) => Compilable,
) {
  const rawDb = getRawDb();
  let insertStmt: ReturnType<typeof rawDb.prepare> | undefined;
  let columns: Array<keyof Row> = [];

  return (row: Row) => {
    if (insertStmt === undefined) {
      const compiledQuery = buildQuery(row).compile();
      columns = Object.keys(row);
      insertStmt = rawDb.prepare(compiledQuery.sql);
    }

    insertStmt.run(columns.map((column) => row[column]));
  };
}

/**
 * Comments that will be added to the generated types and diagram
 */
export const comments: Record<string, Record<string, string>> = {
  attribution: {
    _table_:
      "External attributions (UI: 'signals') and manual attributions (UI: 'attributions')",
    additional_data:
      'Additional attribution properties kept as JSON for compatibility, including unknown and unused properties',
    origin_ids: 'Canonical JSON array containing attribution origin IDs',
    preferred_over_origin_ids:
      'Canonical JSON array containing origin IDs this attribution is preferred over',
    resource_access:
      'Whether this attribution has only readonly resources, only writable resources, or both.',
  },
  resource: {
    name: 'The name of the root resource is the empty string',
    path: 'Without trailing slash.\nThe path of the root resource is the empty string',
    can_have_children: 'Is a directory or in files_with_children',
    max_descendant_id:
      'The highest id of a descendant of this resource. As the resources are numbered depth-first, this enables us to identify the children of resource R by checking if child.id is between R.id and R.max_descendant_id, which is very fast. See https://en.wikipedia.org/wiki/Nested_set_model',
    is_readonly:
      'Whether the most specific split-info readonly rule makes this resource readonly.',
    has_editable_descendant:
      'Whether this resource or any descendant is writable and must be shown in the editable-partition tree.',
  },
  source_for_attribution: {
    external_attribution_source_key:
      'Mainly contains keys of external_attribution_source, but can also contain unknown values',
  },
  resource_to_attribution: {
    attribution_is_external:
      'Denormalized data for faster checking if a resource has manual/external attribution',
  },
  readonly_rule: {
    _table_:
      'Readonly path overrides loaded from split-info.json. An empty table represents an unsplit project. The most specific matching path applies.',
  },
};

const ATTRIBUTION_INDEX_COLUMNS = [
  'pre_selected',
  'criticality',
  'classification',
  'first_party',
  'exclude_from_notice',
  'was_preferred',
  'copyright',
  'license_name',
  'url',
  'package_name',
  'package_namespace',
  'package_version',
  'package_type',
  'package_purl_appendix',
  'attribution_confidence',
  'follow_up',
  'needs_review',
  'preferred',
  'original_attribution_id',
  'original_attribution_was_preferred',
  'comment',
  'canonical_license_name',
] as const satisfies ReadonlyArray<keyof DB['attribution']>;

export async function initializeDb(inputFile: ParsedFileContent) {
  resetDb();
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await initializeExternalAttributionSourceTable(
        trx,
        inputFile.externalAttributionSources,
      );

      await initializeClassificationTable(
        trx,
        inputFile.config.classifications,
      );

      const resourcePathToId = await initializeResourceTable(
        trx,
        inputFile.resources,
        inputFile.attributionBreakpoints,
        inputFile.filesWithChildren,
        inputFile.baseUrlsForSources,
        inputFile.readonlyRules,
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

      await initializeAttributionResourceAccess(trx);

      await initializeFrequentLicenseTable(trx, inputFile.frequentLicenses);

      await initializeClosestAttributedAncestorsTable(trx);

      await initializeMetadataTable(trx, inputFile.metadata);

      await initializeReadonlyRuleTable(trx, inputFile.readonlyRules);
    });
}

export async function initializeClosestAttributedAncestorsTable(
  trx: Transaction<DB>,
) {
  await trx.schema
    .createTable('closest_attributed_ancestors')
    .addColumn('resource_id', 'integer', (col) =>
      col.primaryKey().notNull().references('resource.id'),
    )
    .addColumn('is_file', 'integer', (col) => col.notNull())
    .addColumn('resource_is_readonly', 'integer', (col) => col.notNull())
    .addColumn('breakpoint', 'integer', (col) =>
      col.notNull().references('resource.id'),
    )
    .addColumn('manual', 'integer', (col) => col.references('resource.id'))
    .addColumn('manual_is_readonly', 'integer')
    .addColumn('external', 'integer', (col) => col.references('resource.id'))
    .addColumn('external_is_readonly', 'integer')
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
    WHERE attribution_is_external = 1 AND attribution_uuid NOT IN (SELECT uuid FROM attribution WHERE is_external = 1 AND is_resolved = 1)
  ),
  closest_attributed_ancestors(resource_id, parent_id, is_file, resource_is_readonly, breakpoint, manual, manual_is_readonly, external, external_is_readonly) AS (
    SELECT r.id, r.parent_id, r.is_file, r.is_readonly, r.id,
    IIF(r.id IN has_manual_attribution, r.id, NULL),
    IIF(r.id IN has_manual_attribution, r.is_readonly, NULL),
    IIF(r.id IN has_unresolved_external_attribution, r.id, NULL),
    IIF(r.id IN has_unresolved_external_attribution, r.is_readonly, NULL)
    FROM resource as r
    WHERE path = ''

    UNION ALL
    
    SELECT child.id, child.parent_id, child.is_file, child.is_readonly,
    IIF(child.is_attribution_breakpoint, child.id, parent.breakpoint),
    IIF(child.id IN has_manual_attribution, child.id, 
        IIF(child.is_attribution_breakpoint, NULL, parent.manual)
    ),
    IIF(child.id IN has_manual_attribution, child.is_readonly,
        IIF(child.is_attribution_breakpoint, NULL, parent.manual_is_readonly)
    ),
    IIF(child.id IN has_unresolved_external_attribution, child.id, 
        IIF(child.is_attribution_breakpoint, NULL, parent.external)
    ),
    IIF(child.id IN has_unresolved_external_attribution, child.is_readonly,
        IIF(child.is_attribution_breakpoint, NULL, parent.external_is_readonly)
    )
    FROM resource as child
    JOIN closest_attributed_ancestors as parent ON child.parent_id = parent.resource_id
  )
  SELECT resource_id, is_file, resource_is_readonly, breakpoint, manual, manual_is_readonly, external, external_is_readonly FROM closest_attributed_ancestors
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

  await trx.schema
    .createIndex('closest_attributed_ancestors_editable_file_idx')
    .on('closest_attributed_ancestors')
    .columns([
      'is_file',
      'resource_is_readonly',
      'manual_is_readonly',
      'manual',
      'resource_id',
    ])
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

async function initializeClassificationTable(
  trx: Transaction<DB>,
  classificationConfig: RawClassificationsConfig,
) {
  await trx.schema
    .createTable('classification')
    .addColumn('classification', 'integer', (col) => col.primaryKey().notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .execute();

  for (const [number, description] of Object.entries(classificationConfig)) {
    await trx
      .insertInto('classification')
      .values({
        classification: parseInt(number),
        description,
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
  readonlyRules: ReadonlyRule[],
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
    .addColumn('is_readonly', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('has_editable_descendant', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
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
      (id, path, name, parent_id, is_attribution_breakpoint, is_file, is_readonly, has_editable_descendant, can_have_children, base_url, max_descendant_id)
    VALUES
      ($id, $path, $name, $parent_id, $is_attribution_breakpoint, $is_file, $is_readonly, $has_editable_descendant, $can_have_children, $base_url, $max_descendant_id)
  `);
  type ResourceRow = {
    id: number;
    path: string;
    name: string;
    parent_id: number | null;
    is_attribution_breakpoint: number;
    is_file: number;
    is_readonly: number;
    has_editable_descendant: number;
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
  const readonlyRulesByPath = new Map(
    readonlyRules.map((rule) => [rule.path, rule.readonly]),
  );

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
    parentIsReadonly: boolean,
    result: Array<ResourceRow>,
  ): { maxDescendantId: number; hasEditableDescendant: boolean } {
    const resourceId = nextId++;
    const currentPath = parentPath === null ? '' : `${parentPath}/${name}`;
    const isLeaf = children === 1;
    const isFile = isLeaf || trimmedFilesWithChildren.has(currentPath);
    const isAttributionBreakpoint =
      trimmedAttributionBreakpoints.has(currentPath);
    const isReadonly =
      readonlyRulesByPath.get(currentPath || '/') ?? parentIsReadonly;

    resourcePathToId.set(currentPath, resourceId);

    let lastDescendantId = resourceId;
    let hasEditableDescendant = !isReadonly;
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
        const childResult = recursivelyCollectResource(
          name,
          children,
          resourceId,
          currentPath,
          isReadonly,
          result,
        );
        lastDescendantId = childResult.maxDescendantId;
        hasEditableDescendant ||= childResult.hasEditableDescendant;
      }
    }
    result[resourceId - 1] = {
      id: resourceId,
      path: currentPath,
      name,
      parent_id: parentId,
      is_attribution_breakpoint: Number(isAttributionBreakpoint),
      is_file: Number(isFile),
      is_readonly: Number(isReadonly),
      has_editable_descendant: Number(hasEditableDescendant),
      can_have_children: Number(!isLeaf),
      base_url: trimmedBaseUrlsForSources[currentPath],
      max_descendant_id: lastDescendantId,
    };
    return { maxDescendantId: lastDescendantId, hasEditableDescendant };
  }

  const resourcesToInsert: Array<ResourceRow> = [];
  // The root resource has '' as name and path
  recursivelyCollectResource(
    '',
    resources,
    null,
    null,
    false,
    resourcesToInsert,
  );
  insertMany(resourcesToInsert);

  await trx.schema
    .createIndex('resource_parent_id_covering_idx')
    .on('resource')
    .columns(['parent_id', 'id', 'is_file', 'is_attribution_breakpoint'])
    .execute();

  await trx.schema
    .createIndex('resource_is_readonly_id_idx')
    .on('resource')
    .columns(['is_readonly', 'id'])
    .execute();

  await trx.schema
    .createIndex('resource_has_editable_descendant_id_idx')
    .on('resource')
    .column('id')
    .where(sql.ref('has_editable_descendant'), '=', 1)
    .execute();

  await trx.schema
    .createIndex('resource_attribution_breakpoint_idx')
    .on('resource')
    .column('is_attribution_breakpoint')
    .where('is_attribution_breakpoint', '=', 1)
    .execute();

  return resourcePathToId;
}

async function initializeAttributionTable(
  trx: Transaction<DB>,
  externalAttributions: InputFileAttributionData,
  manualAttributions: InputFileAttributionData,
  resolvedExternalAttributions: Set<string>,
) {
  const attributionExpressionBuilder = expressionBuilder<DB, 'attribution'>();
  const isBoolean = (ref: ReferenceExpression<DB, 'attribution'>) =>
    attributionExpressionBuilder(ref, 'in', [sql.lit(0), sql.lit(1)]);
  const isNullableJsonArray = (ref: ReferenceExpression<DB, 'attribution'>) =>
    attributionExpressionBuilder.or([
      attributionExpressionBuilder(ref, 'is', null),
      attributionExpressionBuilder.and([
        attributionExpressionBuilder(
          attributionExpressionBuilder.fn<number>('json_valid', [ref]),
          '=',
          sql.lit(1),
        ),
        attributionExpressionBuilder(
          attributionExpressionBuilder.fn<string>('json_type', [ref]),
          '=',
          sql.lit('array'),
        ),
      ]),
    ]);

  await trx.schema
    .createTable('attribution')
    .addColumn('uuid', 'text', (col) => col.primaryKey().notNull())
    .addColumn('additional_data', 'text', (col) =>
      col
        .notNull()
        .defaultTo('{}')
        .check(
          attributionExpressionBuilder.and([
            attributionExpressionBuilder(
              attributionExpressionBuilder.fn<number>('json_valid', [
                'additional_data',
              ]),
              '=',
              sql.lit(1),
            ),
            attributionExpressionBuilder(
              attributionExpressionBuilder.fn<string>('json_type', [
                'additional_data',
              ]),
              '=',
              sql.lit('object'),
            ),
          ]),
        ),
    )
    .addColumn('is_external', 'integer', (col) =>
      col.notNull().check(isBoolean('is_external')),
    )
    .addColumn('is_resolved', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('is_resolved')),
    )
    .addColumn('resource_access', 'integer', (col) =>
      col
        .notNull()
        .defaultTo(AttributionResourceAccess.Writable)
        .check(
          attributionExpressionBuilder(
            'resource_access',
            'in',
            ATTRIBUTION_RESOURCE_ACCESS_VALUES.map((value) => sql.lit(value)),
          ),
        ),
    )
    .addColumn('original_attribution_source_name', 'text')
    .addColumn(
      'original_attribution_source_document_confidence',
      'integer',
      (col) =>
        col.check(
          attributionExpressionBuilder.or([
            attributionExpressionBuilder(
              'original_attribution_source_document_confidence',
              'is',
              null,
            ),
            attributionExpressionBuilder.between(
              'original_attribution_source_document_confidence',
              sql.lit(0),
              sql.lit(100),
            ),
          ]),
        ),
    )
    .addColumn('original_attribution_source_additional_name', 'text')
    .addColumn('origin_ids', 'text', (col) =>
      col.check(isNullableJsonArray('origin_ids')),
    )
    .addColumn('preferred_over_origin_ids', 'text', (col) =>
      col.check(isNullableJsonArray('preferred_over_origin_ids')),
    )
    .addColumn('source_name', 'text')
    .addColumn('source_document_confidence', 'integer', (col) =>
      col.check(
        attributionExpressionBuilder.or([
          attributionExpressionBuilder(
            'source_document_confidence',
            'is',
            null,
          ),
          attributionExpressionBuilder.between(
            'source_document_confidence',
            sql.lit(0),
            sql.lit(100),
          ),
        ]),
      ),
    )
    .addColumn('source_additional_name', 'text')
    .addColumn('pre_selected', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('pre_selected')),
    )
    .addColumn('criticality', 'integer', (col) =>
      col
        .notNull()
        .defaultTo(Criticality.None)
        .check(
          attributionExpressionBuilder(
            'criticality',
            'in',
            [Criticality.None, Criticality.Medium, Criticality.High].map(
              (value) => sql.lit(value),
            ),
          ),
        ),
    )
    .addColumn('first_party', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('first_party')),
    )
    .addColumn('exclude_from_notice', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('exclude_from_notice')),
    )
    .addColumn('was_preferred', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('was_preferred')),
    )
    .addColumn('copyright', 'text')
    .addColumn('license_name', 'text')
    .addColumn('license_text', 'text')
    .addColumn('url', 'text')
    .addColumn('package_name', 'text')
    .addColumn('package_namespace', 'text')
    .addColumn('package_version', 'text')
    .addColumn('package_type', 'text')
    .addColumn('package_purl_appendix', 'text')
    .addColumn('attribution_confidence', 'integer', (col) =>
      col.check(
        attributionExpressionBuilder.or([
          attributionExpressionBuilder('attribution_confidence', 'is', null),
          attributionExpressionBuilder.between(
            'attribution_confidence',
            sql.lit(0),
            sql.lit(100),
          ),
        ]),
      ),
    )
    .addColumn('follow_up', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('follow_up')),
    )
    .addColumn('needs_review', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('needs_review')),
    )
    .addColumn('preferred', 'integer', (col) =>
      col.notNull().defaultTo(0).check(isBoolean('preferred')),
    )
    .addColumn('original_attribution_id', 'text')
    .addColumn('original_attribution_was_preferred', 'integer', (col) =>
      col
        .notNull()
        .defaultTo(0)
        .check(isBoolean('original_attribution_was_preferred')),
    )
    .addColumn('comment', 'text')
    .addColumn('classification', 'integer', (col) =>
      col.check(
        attributionExpressionBuilder.or([
          attributionExpressionBuilder('classification', 'is', null),
          attributionExpressionBuilder('classification', '>=', sql.lit(0)),
        ]),
      ),
    )
    .addColumn('canonical_license_name', 'text', (col) =>
      col.generatedAlwaysAs(toCanonicalLicenseName(sql`license_name`)).stored(),
    )
    .execute();

  const insertAttribution = createPreparedInserter<AttributionInsertRow>(
    (row) => trx.insertInto('attribution').values(row),
  );

  for (const [uuid, attribution] of Object.entries(
    externalAttributions.attributions,
  )) {
    insertAttribution({
      uuid,
      ...getAttributionPersistenceValues(attribution),
      is_external: Number(true),
      is_resolved: Number(resolvedExternalAttributions.has(uuid)),
    });
  }

  for (const [uuid, attribution] of Object.entries(
    manualAttributions.attributions,
  )) {
    insertAttribution({
      uuid,
      ...getAttributionPersistenceValues(attribution),
      is_external: Number(false),
      is_resolved: Number(false),
    });
  }

  for (const column of ATTRIBUTION_INDEX_COLUMNS) {
    await trx.schema
      .createIndex(`attribution_${column}_idx`)
      .on('attribution')
      .columns(['is_external', column])
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
    .columns(['is_external', 'is_resolved', 'uuid'])
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

  const insertSource = createPreparedInserter<SourceForAttributionInsertRow>(
    (row) => trx.insertInto('source_for_attribution').values(row),
  );

  for (const [uuid, attribution] of Object.entries(
    externalAttributions.attributions,
  )) {
    if (attribution.source) {
      const row: SourceForAttributionInsertRow = {
        attribution_uuid: uuid,
        external_attribution_source_key: attribution.source.name,
        document_confidence: attribution.source.documentConfidence ?? null,
        additional_name: attribution.source.additionalName ?? null,
      };
      insertSource(row);
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
    .column('attribution_uuid')
    .execute();
}

export async function initializeAttributionResourceAccess(
  trx: Transaction<DB>,
  createIndex = true,
) {
  await sql`
    WITH resource_accesses AS MATERIALIZED (
      SELECT
        rta.attribution_uuid,
        CASE
          WHEN MIN(r.is_readonly) = 1 THEN ${AttributionResourceAccess.Readonly}
          WHEN MAX(r.is_readonly) = 0 THEN ${AttributionResourceAccess.Writable}
          ELSE ${AttributionResourceAccess.Mixed}
        END AS resource_access
      FROM resource_to_attribution AS rta
      INNER JOIN resource AS r ON r.id = rta.resource_id
      GROUP BY rta.attribution_uuid
    )
    UPDATE attribution
    SET resource_access = COALESCE(
      (
        SELECT resource_access
        FROM resource_accesses
        WHERE attribution_uuid = attribution.uuid
      ),
      (
        SELECT CASE
          WHEN is_readonly = 1 THEN ${AttributionResourceAccess.Readonly}
          ELSE ${AttributionResourceAccess.Writable}
        END
        FROM resource
        WHERE path = ''
      )
    )
  `.execute(trx);

  if (createIndex) {
    await trx.schema
      .createIndex('attribution_resource_access_audit_idx')
      .on('attribution')
      .columns(['resource_access', 'is_external', 'is_resolved', 'uuid'])
      .execute();
  }
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

async function initializeMetadataTable(
  trx: Transaction<DB>,
  metadata: ProjectMetadata,
) {
  await trx.schema
    .createTable('metadata')
    .addColumn('key', 'text', (col) => col.primaryKey().notNull())
    .addColumn('value_json', 'text', (col) => col.notNull())
    .execute();

  for (const [key, value] of Object.entries(metadata)) {
    await trx
      .insertInto('metadata')
      .values({
        key,
        value_json: JSON.stringify(value),
      })
      .execute();
  }
}

async function initializeReadonlyRuleTable(
  trx: Transaction<DB>,
  readonlyRules: ParsedFileContent['readonlyRules'],
) {
  await trx.schema
    .createTable('readonly_rule')
    .addColumn('path', 'text', (col) => col.primaryKey().notNull())
    .addColumn('readonly', 'integer', (col) => col.notNull())
    .execute();

  if (readonlyRules.length > 0) {
    await trx
      .insertInto('readonly_rule')
      .values(
        readonlyRules.map((rule) => ({
          path: rule.path,
          readonly: Number(rule.readonly),
        })),
      )
      .execute();
  }
}
