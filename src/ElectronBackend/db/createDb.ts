// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ParsedFileContent, Resources } from '../../shared/shared-types';
import { getDb, resetDb } from './db';

export async function initializeDb(inputFile: ParsedFileContent) {
  resetDb();

  await getDb()
    .transaction()
    .execute(async (trx) => {
      await trx.schema
        .createTable('external_attribution_source')
        .addColumn('name', 'text', (col) => col.primaryKey())
        .addColumn('priority', 'integer', (col) => col.notNull())
        .addColumn('is_relevant_for_preferred', 'integer', (col) =>
          col.notNull().defaultTo(0),
        )
        .execute();

      for (const [key, source] of Object.entries(
        inputFile.externalAttributionSources,
      )) {
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

      await trx.schema
        .createTable('resource')
        .addColumn('id', 'integer', (col) => col.primaryKey())
        .addColumn('path', 'text', (col) => col.notNull().unique())
        .addColumn('name', 'text', (col) => col.notNull())
        .addColumn('parent_id', 'integer', (col) =>
          col.references('resource.id'),
        )
        .addColumn('is_attribution_breakpoint', 'integer', (col) =>
          col.notNull().defaultTo(0),
        )
        .addColumn('is_file', 'integer', (col) => col.notNull().defaultTo(0))
        .execute();

      const attributionBreakpointPaths = inputFile.attributionBreakpoints;
      const filesWithChildrenPaths = inputFile.filesWithChildren;
      const pathToId = new Map<string, number>();

      async function recursivelyInsertResources(
        resources: Resources,
        parentId: number | null = null,
        parentPath: string = '',
      ) {
        for (const [key, resource] of Object.entries(resources)) {
          const currentPath =
            parentPath === '' ? `/${key}` : `${parentPath}/${key}`;
          const isLeaf = resource === 1;
          const isFile = isLeaf || filesWithChildrenPaths.has(currentPath);
          const isAttributionBreakpoint =
            attributionBreakpointPaths.has(currentPath);

          const result = await trx
            .insertInto('resource')
            .values({
              path: currentPath,
              name: key,
              parent_id: parentId,
              is_attribution_breakpoint: Number(isAttributionBreakpoint),
              is_file: Number(isFile),
            })
            .returning('id')
            .executeTakeFirstOrThrow();

          const resourceId = result.id;
          pathToId.set(currentPath, resourceId);

          if (!isLeaf) {
            await recursivelyInsertResources(resource, resourceId, currentPath);
          }
        }
      }

      await recursivelyInsertResources(inputFile.resources);

      await trx.schema
        .createIndex('resource_parent_id_idx')
        .on('resource')
        .column('parent_id')
        .execute();

      await trx.schema
        .createTable('attribution')
        .addColumn('id', 'integer', (col) => col.primaryKey())
        .addColumn('uuid', 'text', (col) => col.notNull().unique())
        .addColumn('data', 'text', (col) => col.notNull())
        .addColumn('is_external', 'integer', (col) => col.notNull())
        .addColumn('is_resolved', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('external_attribution_source_id', 'text', (col) =>
          col.references('external_attribution_source.name'),
        )
        .execute();

      const uuidToId = new Map<string, number>();

      for (const [uuid, attribution] of Object.entries(
        inputFile.externalAttributions.attributions,
      )) {
        const isResolved = inputFile.resolvedExternalAttributions.has(uuid);
        const sourceId = attribution.source?.name ?? null;

        const result = await trx
          .insertInto('attribution')
          .values({
            uuid,
            data: JSON.stringify(attribution),
            is_external: Number(true),
            is_resolved: Number(isResolved),
            external_attribution_source_id: sourceId,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        uuidToId.set(uuid, result.id);
      }

      for (const [uuid, attribution] of Object.entries(
        inputFile.manualAttributions.attributions,
      )) {
        const result = await trx
          .insertInto('attribution')
          .values({
            uuid,
            data: JSON.stringify(attribution),
            is_external: Number(false),
            is_resolved: Number(false),
            external_attribution_source_id: null,
          })
          .returning('id')
          .executeTakeFirstOrThrow();

        uuidToId.set(uuid, result.id);
      }

      await trx.schema
        .createIndex('attribution_external_idx')
        .on('attribution')
        .column('is_external')
        .execute();

      await trx.schema
        .createIndex('attribution_resolved_idx')
        .on('attribution')
        .column('is_resolved')
        .where('is_resolved', '=', 1)
        .execute();

      await trx.schema
        .createIndex('attribution_external_attribution_source_id_idx')
        .on('attribution')
        .column('external_attribution_source_id')
        .execute();

      await trx.schema
        .createTable('resource_to_attribution')
        .addColumn('resource_id', 'integer', (col) =>
          col.notNull().references('resource.id'),
        )
        .addColumn('attribution_id', 'integer', (col) =>
          col.notNull().references('attribution.id'),
        )
        .addPrimaryKeyConstraint('resource_to_attribution_pk', [
          'resource_id',
          'attribution_id',
        ])
        .execute();

      for (const [resourcePath, attributionUuids] of [
        ...Object.entries(inputFile.externalAttributions.resourcesToAttributions),
        ...Object.entries(inputFile.manualAttributions.resourcesToAttributions),
      ]) {
        const normalizedPath = resourcePath.replace(/\/$/, '') || '/';
        const resourceId = pathToId.get(normalizedPath);
        if (resourceId === undefined) {
          continue;
        }

        for (const uuid of attributionUuids) {
          const attributionId = uuidToId.get(uuid);
          if (attributionId === undefined) {
            continue;
          }

          await trx
            .insertInto('resource_to_attribution')
            .values({
              resource_id: resourceId,
              attribution_id: attributionId,
            })
            .onConflict((oc) => oc.doNothing())
            .execute();
        }
      }

      await trx.schema
        .createIndex('resource_to_attribution_resource_id_idx')
        .on('resource_to_attribution')
        .column('resource_id')
        .execute();

      await trx.schema
        .createIndex('resource_to_attribution_attribution_id_idx')
        .on('resource_to_attribution')
        .column('attribution_id')
        .execute();

      await trx.schema
        .createTable('frequent_license')
        .addColumn('id', 'integer', (col) => col.primaryKey())
        .addColumn('short_name', 'text', (col) => col.notNull())
        .addColumn('full_name', 'text', (col) => col.notNull())
        .addColumn('license_text', 'text')
        .execute();

      for (const license of inputFile.frequentLicenses.nameOrder) {
        const licenseText =
          inputFile.frequentLicenses.texts[license.shortName] ?? null;

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
    });
}
