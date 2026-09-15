// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Expression,
  type ExpressionBuilder,
  expressionBuilder,
  type Kysely,
  type SqlBool,
  type Transaction,
} from 'kysely';

import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import {
  getOnlyExternalFilesQuery,
  getOnlyPreSelectedManualFilesQuery,
} from './progressBarUtils';
import { removeTrailingSlash, toCanonicalLicenseName } from './utils';

export const FILTERED_RESOURCE_TEMP_TABLE = 'filtered_resources';
export type FilteredTable = { filtered_resources: { id: number } };
export type LicenseFilter = { licenseName: string; external: boolean };
export type ResourceTreeFilters = {
  search?: string;
  onlyUnreviewedFiles?: boolean;
  licenseFilter?: LicenseFilter;
  onAttributionUuids?: Array<string>;
  onlyWritable?: boolean;
};

type FilteredResourcesCacheEntry = { key?: string };
const filteredResourcesCaches = new WeakMap<
  Kysely<DB>,
  FilteredResourcesCacheEntry
>();

function getFilterKey(filters: ResourceTreeFilters) {
  return JSON.stringify([
    filters.search,
    filters.licenseFilter,
    filters.onlyUnreviewedFiles,
    filters.onAttributionUuids,
    filters.onlyWritable,
  ]);
}

export function invalidateFilteredResourcesCache(db: Kysely<DB>) {
  filteredResourcesCaches.delete(db);
}

export function hasActiveNonSearchFilters(filters: ResourceTreeFilters) {
  return Boolean(
    filters.licenseFilter ||
    filters.onAttributionUuids ||
    filters.onlyUnreviewedFiles ||
    filters.onlyWritable,
  );
}

export function hasActiveFilters(filters: ResourceTreeFilters) {
  return Boolean(filters.search || hasActiveNonSearchFilters(filters));
}

async function prepareFilteredResourcesTable(
  trx: Transaction<DB>,
  filters: ResourceTreeFilters,
): Promise<void> {
  await trx.schema.dropTable(FILTERED_RESOURCE_TEMP_TABLE).ifExists().execute();
  await trx.schema
    .createTable(FILTERED_RESOURCE_TEMP_TABLE)
    .temporary()
    .as(getFilteredResourcesQuery(trx, filters))
    .execute();
  await trx.schema
    .createIndex('temp.filtered_resources_id_idx')
    .on(FILTERED_RESOURCE_TEMP_TABLE)
    .column('id')
    .execute();
}

export async function withFilteredResourcesTable<T>(
  filters: ResourceTreeFilters,
  query: (trx: Transaction<DB>) => Promise<T>,
): Promise<T> {
  const db = getDb();
  const key = getFilterKey(filters);
  return db.transaction().execute(async (trx) => {
    // The transaction may have waited behind another read that prepared this
    // table, so inspect the cache only after it has acquired the connection.
    if (filteredResourcesCaches.get(db)?.key === key) {
      return query(trx);
    }

    const entry: FilteredResourcesCacheEntry = {};
    filteredResourcesCaches.set(db, entry);
    await prepareFilteredResourcesTable(trx, filters);
    const result = await query(trx);
    entry.key = key;
    return result;
  });
}

export function filteredResourcesContainIdBetween(
  a: Expression<number>,
  b: Expression<number>,
) {
  const eb = expressionBuilder<DB & FilteredTable>();
  return eb.exists((eb) =>
    eb
      .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
      .selectAll()
      .where((eb) => eb.between('id', a, b)),
  );
}

export function getMatchesFiltersExpression({
  id,
  path,
  name,
  filters,
}: {
  id: Expression<number>;
  path: Expression<string>;
  name: Expression<string>;
  filters: ResourceTreeFilters;
}) {
  const eb = expressionBuilder<DB & FilteredTable>();
  if (hasActiveNonSearchFilters(filters)) {
    return filteredResourcesContainIdBetween(id, id);
  }
  return getSearchMatchExpression(eb, path, name, filters.search);
}

export function getSearchMatchExpression<TDB, TB extends keyof TDB & string>(
  eb: ExpressionBuilder<TDB, TB>,
  path: Expression<string>,
  name: Expression<string>,
  search: string | undefined,
) {
  const normalizedSearch = removeTrailingSlash(search ?? '');
  const lastSearchPart = normalizedSearch.split('/').at(-1);

  return eb.and([
    eb(path, 'like', `%${normalizedSearch}%`),
    eb(name, 'like', `%${lastSearchPart}%`),
  ]);
}

export function getVisibleWithFiltersExpression({
  id,
  maxDescendantId,
  isReadonly,
  inheritedMatch,
  filters,
}: {
  id: Expression<number>;
  maxDescendantId: Expression<number>;
  isReadonly: Expression<number>;
  inheritedMatch: Expression<SqlBool>;
  filters: ResourceTreeFilters;
}) {
  const eb = expressionBuilder<DB & FilteredTable>();
  return eb.or([
    filteredResourcesContainIdBetween(id, maxDescendantId),
    filters.onlyWritable
      ? eb.and([eb(isReadonly, '=', 0), inheritedMatch])
      : inheritedMatch,
  ]);
}

export function getFilteredResourcesQuery(
  trx: Transaction<DB>,
  {
    licenseFilter,
    onlyUnreviewedFiles,
    onAttributionUuids,
    search,
    onlyWritable,
  }: ResourceTreeFilters,
) {
  let query = trx.selectFrom('resource as r').select('r.id as id');
  if (search) {
    query = query.where('r.path', 'like', `%${removeTrailingSlash(search)}%`);
  }
  if (licenseFilter) {
    query = query.where('r.id', 'in', (eb) =>
      eb
        .selectFrom('attribution as a')
        .innerJoin(
          'resource_to_attribution as rta',
          'rta.attribution_uuid',
          'a.uuid',
        )
        .select('rta.resource_id')
        .where('a.is_external', '=', Number(licenseFilter.external))
        .where(
          'a.canonical_license_name',
          '=',
          toCanonicalLicenseName(licenseFilter.licenseName),
        ),
    );
  }
  if (onAttributionUuids) {
    query = query.where((eb) =>
      eb.exists((eb) =>
        eb
          .selectFrom('resource_to_attribution as rta')
          .select('rta.resource_id')
          .whereRef('rta.resource_id', '=', 'r.id')
          .where('rta.attribution_uuid', 'in', onAttributionUuids),
      ),
    );
  }
  if (onlyUnreviewedFiles) {
    const filterExpressionBuilder = expressionBuilder<
      DB,
      'closest_attributed_ancestors'
    >();
    query = query
      .where((eb) =>
        eb.or([
          eb('r.id', 'in', getOnlyExternalFilesQuery(filterExpressionBuilder)),
          eb(
            'r.id',
            'in',
            getOnlyPreSelectedManualFilesQuery(filterExpressionBuilder),
          ),
        ]),
      )
      .where('r.is_file', '=', 1)
      .where('r.is_readonly', '=', 0);
  }
  if (onlyWritable) {
    query = query.where('r.is_readonly', '=', 0);
  }
  return query;
}
