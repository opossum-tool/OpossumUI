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
  FILTERED_RESOURCE_TEMP_TABLE,
  type FilteredTable,
  invalidateFilteredResourcesCache,
  withFilteredResourcesTable,
} from '../resourceTree';

const firstFilters = { search: 'first' };
const secondFilters = { search: 'second' };

async function filteredPaths(filters = firstFilters) {
  return withFilteredResourcesTable(filters, async (trx) =>
    (
      await trx
        .$extendTables<FilteredTable>()
        .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
        .innerJoin('resource as r', 'r.id', 'filtered_resources.id')
        .select('r.path')
        .orderBy('r.path')
        .execute()
    ).map((resource) => resource.path),
  );
}

function preparedTableCount() {
  const prepare = vi.spyOn(getRawDb(), 'prepare');
  return () =>
    prepare.mock.calls.filter(([sql]) =>
      sql.toLowerCase().includes('create temporary table "filtered_resources"'),
    ).length;
}

describe('withFilteredResourcesTable', () => {
  beforeEach(async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/first/file.ts', '/second/file.ts']),
    });
  });

  it('reuses a prepared table for queued identical reads', async () => {
    const getPreparedTableCount = preparedTableCount();
    let releaseFirstRead: () => void;
    let signalFirstReadStarted: () => void;
    const firstReadStarted = new Promise<void>((resolve) => {
      signalFirstReadStarted = resolve;
    });
    const firstRead = withFilteredResourcesTable(firstFilters, async (trx) => {
      const paths = await trx
        .$extendTables<FilteredTable>()
        .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
        .innerJoin('resource as r', 'r.id', 'filtered_resources.id')
        .select('r.path')
        .execute();
      signalFirstReadStarted!();
      await new Promise<void>((resolve) => {
        releaseFirstRead = resolve;
      });
      return paths.map((resource) => resource.path);
    });
    await firstReadStarted;
    const secondRead = filteredPaths();

    releaseFirstRead!();

    await expect(Promise.all([firstRead, secondRead])).resolves.toEqual([
      ['/first', '/first/file.ts'],
      ['/first', '/first/file.ts'],
    ]);
    expect(getPreparedTableCount()).toBe(1);
  });

  it('rebuilds when filters change and restores a previous filter', async () => {
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
  });

  it('rebuilds after invalidation during a pending read', async () => {
    const getPreparedTableCount = preparedTableCount();
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
    expect(getPreparedTableCount()).toBe(2);
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
      .selectFrom(FILTERED_RESOURCE_TEMP_TABLE)
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
    const firstPreparedTableCount = preparedTableCount();
    expect(await filteredPaths()).toEqual(['/first', '/first/file.ts']);
    expect(firstPreparedTableCount()).toBe(1);

    await initializeDbWithTestData({
      resources: pathsToResources(['/first/replacement.ts']),
    });
    const secondPreparedTableCount = preparedTableCount();

    expect(await filteredPaths()).toEqual(['/first', '/first/replacement.ts']);
    expect(secondPreparedTableCount()).toBe(1);
  });
});
