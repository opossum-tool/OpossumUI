// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Kysely, Transaction } from 'kysely';

import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import {
  type FilteredTable,
  getFilteredResourcesQuery,
  type ResourceTreeFilters,
} from './resourceTreeFilters';

const FILTERED_RESOURCES_CACHE_CAPACITY = 4;

type FilteredResourcesCache = {
  entries: Map<string, number>;
  nextCacheId: number;
};

const filteredResourcesCaches = new WeakMap<
  Kysely<DB>,
  FilteredResourcesCache
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

async function populateFilteredResources(
  trx: Transaction<DB>,
  filters: ResourceTreeFilters,
  cacheId: number,
) {
  await trx
    .$extendTables<FilteredTable>()
    .insertInto('filtered_resources')
    .columns(['id', 'cache_id'])
    .expression((eb) =>
      getFilteredResourcesQuery(trx, filters).select(
        eb.val(cacheId).as('cache_id'),
      ),
    )
    .execute();
}

export async function withFilteredResourcesTable<T>(
  filters: ResourceTreeFilters,
  query: (trx: Transaction<DB>, cacheId: number) => Promise<T>,
): Promise<T> {
  const db = getDb();
  const key = getFilterKey(filters);
  let cache: FilteredResourcesCache | undefined;
  try {
    return await db.transaction().execute(async (trx) => {
      // The transaction may have waited behind another read that prepared this
      // table, so inspect the cache only after it has acquired the connection.
      cache = filteredResourcesCaches.get(db);
      if (!cache) {
        cache = { entries: new Map(), nextCacheId: 0 };
        filteredResourcesCaches.set(db, cache);
      }
      const cachedId = cache.entries.get(key);
      if (cachedId !== undefined) {
        cache.entries.delete(key);
        cache.entries.set(key, cachedId);
        return query(trx, cachedId);
      }

      if (cache.entries.size === 0) {
        await trx
          .$extendTables<FilteredTable>()
          .deleteFrom('filtered_resources')
          .execute();
      }
      if (cache.entries.size === FILTERED_RESOURCES_CACHE_CAPACITY) {
        const oldestEntry = cache.entries.entries().next().value;
        if (!oldestEntry) {
          throw new Error(
            'Filtered resources cache unexpectedly had no entries',
          );
        }
        const [oldestKey, oldestCacheId] = oldestEntry;
        await trx
          .$extendTables<FilteredTable>()
          .deleteFrom('filtered_resources')
          .where('cache_id', '=', oldestCacheId)
          .execute();
        cache.entries.delete(oldestKey);
      }
      const cacheId = cache.nextCacheId;
      cache.nextCacheId += 1;
      await populateFilteredResources(trx, filters, cacheId);
      cache.entries.set(key, cacheId);
      return query(trx, cacheId);
    });
  } catch (error) {
    if (cache && filteredResourcesCaches.get(db) === cache) {
      filteredResourcesCaches.delete(db);
    }
    throw error;
  }
}
