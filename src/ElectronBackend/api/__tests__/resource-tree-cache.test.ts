// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb, getRawDb } from '../../db/db';
import {
  invalidateFilteredResourcesCache,
  withFilteredResourcesTable,
} from '../resource-tree-cache';
import { getResourceTree } from '../resourceTree';
import { getNodePathsToExpand } from '../resourceTreeExpansion';
import type { FilteredTable } from '../resourceTreeFilters';

const firstFilters = { search: 'first' };
const secondFilters = { search: 'second' };

async function filteredPaths(filters = firstFilters) {
  return withFilteredResourcesTable(filters, async (trx, cacheId) =>
    (
      await trx
        .$extendTables<FilteredTable>()
        .selectFrom('filtered_resources')
        .innerJoin('resource as r', 'r.id', 'filtered_resources.id')
        .where('filtered_resources.cache_id', '=', cacheId)
        .select('r.path')
        .orderBy('r.path')
        .execute()
    ).map((resource) => resource.path),
  );
}

function populatedEntryCount() {
  const prepare = vi.spyOn(getRawDb(), 'prepare');
  return () =>
    prepare.mock.calls.filter(([sql]) =>
      sql.toLowerCase().includes('insert into "filtered_resources"'),
    ).length;
}

describe('withFilteredResourcesTable', () => {
  beforeEach(async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/first/file.ts', '/second/file.ts']),
    });
  });

  it('reuses a prepared table for queued identical reads', async () => {
    const getPopulatedEntryCount = populatedEntryCount();
    let releaseFirstRead: () => void;
    let signalFirstReadStarted: () => void;
    const firstReadStarted = new Promise<void>((resolve) => {
      signalFirstReadStarted = resolve;
    });
    const firstRead = withFilteredResourcesTable(
      firstFilters,
      async (trx, cacheId) => {
        const paths = await trx
          .$extendTables<FilteredTable>()
          .selectFrom('filtered_resources')
          .innerJoin('resource as r', 'r.id', 'filtered_resources.id')
          .where('filtered_resources.cache_id', '=', cacheId)
          .select('r.path')
          .execute();
        signalFirstReadStarted!();
        await new Promise<void>((resolve) => {
          releaseFirstRead = resolve;
        });
        return paths.map((resource) => resource.path);
      },
    );
    await firstReadStarted;
    const secondRead = filteredPaths();

    releaseFirstRead!();

    await expect(Promise.all([firstRead, secondRead])).resolves.toEqual([
      ['/first', '/first/file.ts'],
      ['/first', '/first/file.ts'],
    ]);
    expect(getPopulatedEntryCount()).toBe(1);
  });

  it('reuses isolated entries when alternating filters', async () => {
    const getPopulatedEntryCount = populatedEntryCount();
    expect(await filteredPaths(firstFilters)).toEqual([
      '/first',
      '/first/file.ts',
    ]);
    expect(await filteredPaths(secondFilters)).toEqual([
      '/second',
      '/second/file.ts',
    ]);
    expect(await filteredPaths(firstFilters)).toEqual([
      '/first',
      '/first/file.ts',
    ]);
    expect(getPopulatedEntryCount()).toBe(2);
  });

  it('evicts the least recently used entry after capacity is exceeded', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(
        ['first', 'second', 'third', 'fourth', 'fifth'].map(
          (name) => `/${name}/file.ts`,
        ),
      ),
    });
    const getPopulatedEntryCount = populatedEntryCount();
    const filters = ['first', 'second', 'third', 'fourth', 'fifth'].map(
      (search) => ({ search }),
    );
    for (const filter of filters.slice(0, 4)) {
      await filteredPaths(filter);
    }
    await filteredPaths(filters[0]);
    await filteredPaths(filters[4]);

    const cachedRowCount = (
      await getDb()
        .$extendTables<FilteredTable>()
        .selectFrom('filtered_resources')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow()
    ).count;
    expect(cachedRowCount).toBe(8);

    await filteredPaths(filters[0]);
    await filteredPaths(filters[1]);

    expect(getPopulatedEntryCount()).toBe(6);
  });

  it('rebuilds after invalidation during a pending read', async () => {
    const getPopulatedEntryCount = populatedEntryCount();
    let releaseRead: () => void;
    let signalTablePrepared: () => void;
    const tablePrepared = new Promise<void>((resolve) => {
      signalTablePrepared = resolve;
    });
    const pendingRead = withFilteredResourcesTable(firstFilters, async () => {
      signalTablePrepared!();
      await new Promise<void>((resolve) => {
        releaseRead = resolve;
      });
      return undefined;
    });
    await tablePrepared;
    invalidateFilteredResourcesCache(getDb());
    releaseRead!();
    await pendingRead;

    expect(await filteredPaths()).toEqual(['/first', '/first/file.ts']);
    expect(getPopulatedEntryCount()).toBe(2);
  });

  it('invalidates every entry during a pending cached read', async () => {
    const getPopulatedEntryCount = populatedEntryCount();
    await filteredPaths(firstFilters);
    await filteredPaths(secondFilters);

    let releaseRead: () => void;
    let signalReadStarted: () => void;
    const readStarted = new Promise<void>((resolve) => {
      signalReadStarted = resolve;
    });
    const pendingRead = withFilteredResourcesTable(firstFilters, async () => {
      signalReadStarted!();
      await new Promise<void>((resolve) => {
        releaseRead = resolve;
      });
    });
    await readStarted;
    invalidateFilteredResourcesCache(getDb());
    releaseRead!();
    await pendingRead;

    await filteredPaths(firstFilters);
    await filteredPaths(secondFilters);
    expect(getPopulatedEntryCount()).toBe(4);
  });

  it('rolls back a failed rebuild and retries it from the restored table', async () => {
    expect(await filteredPaths(firstFilters)).toEqual([
      '/first',
      '/first/file.ts',
    ]);

    await expect(
      withFilteredResourcesTable(secondFilters, () =>
        Promise.resolve().then(() => {
          throw new Error('failed read');
        }),
      ),
    ).rejects.toThrow('failed read');

    const restoredPaths = await getDb()
      .$extendTables<FilteredTable>()
      .selectFrom('filtered_resources')
      .innerJoin('resource as r', 'r.id', 'filtered_resources.id')
      .select('r.path')
      .execute();
    expect(restoredPaths.map((resource) => resource.path)).toEqual([
      '/first',
      '/first/file.ts',
    ]);
    expect(await filteredPaths(secondFilters)).toEqual([
      '/second',
      '/second/file.ts',
    ]);
  });

  it('uses an independent table after replacing the database', async () => {
    const firstPopulatedEntryCount = populatedEntryCount();
    expect(await filteredPaths()).toEqual(['/first', '/first/file.ts']);
    expect(firstPopulatedEntryCount()).toBe(1);

    await initializeDbWithTestData({
      resources: pathsToResources(['/first/replacement.ts']),
    });
    const secondPopulatedEntryCount = populatedEntryCount();

    expect(await filteredPaths()).toEqual(['/first', '/first/replacement.ts']);
    expect(secondPopulatedEntryCount()).toBe(1);
  });

  it('shares an entry between tree loading and expansion', async () => {
    const getPopulatedEntryCount = populatedEntryCount();
    const filters = { search: 'first' };

    await getResourceTree({
      ...filters,
      expandedNodes: 'expandAll',
    });
    await getNodePathsToExpand({
      ...filters,
      fromNodePath: '/first/',
    });

    expect(getPopulatedEntryCount()).toBe(1);
  });
});
