// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';

import type { QueryParams } from '../../../ElectronBackend/api/queries';
import { type Attributions, Criticality } from '../../../shared/shared-types';
import {
  enqueueAttributionListReconciliation,
  type ReconcileAttributionListsOptions,
} from '../reconcile-attribution-lists';

type ListAttributionsParams = QueryParams<'listAttributions'>;

function promiseOf<T>(value: T) {
  return Promise.resolve(value);
}

function attribution(id: string, packageName: string): Attributions[string] {
  return { id, criticality: Criticality.None, packageName };
}

function createOptions(
  queryClient: QueryClient,
  fetchAttributions: ReconcileAttributionListsOptions['fetchAttributions'],
  affectedAttributionUuids = ['a', 'c'],
): ReconcileAttributionListsOptions {
  return {
    queryClient,
    affectedAttributionUuids,
    fetchAttributions,
  };
}

function addActiveQuery(
  queryClient: QueryClient,
  params: ListAttributionsParams,
  data: Attributions,
) {
  const queryKey = ['backend', 'listAttributions', params] as const;
  queryClient.setQueryData(queryKey, data);
  const observer = new QueryObserver<Attributions>(queryClient, {
    queryKey,
    queryFn: ({ queryKey: currentQueryKey }) =>
      promiseOf(queryClient.getQueryData(currentQueryKey) ?? {}),
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(
    (_result: QueryObserverResult<Attributions>) => undefined,
  );
  queryClient.setQueryData(queryKey, data);
  return { queryKey, unsubscribe };
}

describe('enqueueAttributionListReconciliation', () => {
  it('reconciles only affected rows and preserves unchanged rows', async () => {
    const queryClient = new QueryClient();
    const params = {
      external: false,
      sort: 'alphabetically',
    } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
    });
    const cancelQueries = vi.spyOn(queryClient, 'cancelQueries');
    const fetchAttributions = vi.fn((targetedParams) => {
      expect(targetedParams).toEqual({
        ...params,
        uuids: ['a', 'c'],
      });
      return promiseOf({
        a: attribution('a', 'updated'),
        c: attribution('c', 'new'),
      });
    });

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions),
    );

    expect(fetchAttributions).toHaveBeenCalledTimes(1);
    expect(cancelQueries).toHaveBeenCalledTimes(2);
    expect(cancelQueries).toHaveBeenNthCalledWith(1, {
      queryKey,
      exact: true,
    });
    expect(queryClient.getQueryData(queryKey)).toEqual({
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
      c: attribution('c', 'new'),
      a: attribution('a', 'updated'),
    });
    unsubscribe();
    queryClient.clear();
  });

  it.each([
    'alphabetically',
    'criticality',
    'occurrence',
    'classification',
  ] as const)('restores %s ordering', async (sort) => {
    const queryClient = new QueryClient();
    const params = { external: false, sort } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'zulu'),
      b: attribution('b', 'bravo'),
      d: attribution('d', 'delta'),
    });

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, () =>
        promiseOf({ a: attribution('a', 'alpha') }),
      ),
    );

    expect(Object.keys(queryClient.getQueryData(queryKey) ?? {})).toEqual([
      'a',
      'b',
      'd',
    ]);
    unsubscribe();
    queryClient.clear();
  });

  it('intersects an existing UUID restriction', async () => {
    const queryClient = new QueryClient();
    const params = {
      external: false,
      uuids: ['a', 'b'],
    } satisfies ListAttributionsParams;
    const { unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
    });
    const fetchAttributions = vi.fn((targetedParams) => {
      expect(targetedParams.uuids).toEqual(['a']);
      return promiseOf({ a: attribution('a', 'updated') });
    });

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions),
    );

    expect(fetchAttributions).toHaveBeenCalledTimes(1);
    unsubscribe();
    queryClient.clear();
  });

  it('marks inactive queries stale without fetching them', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const queryKey = ['backend', 'listAttributions', params] as const;
    queryClient.setQueryData(queryKey, { a: attribution('a', 'old') });
    const fetchAttributions = vi.fn(() =>
      promiseOf({ a: attribution('a', 'updated') }),
    );

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions),
    );

    expect(fetchAttributions).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it('uses one targeted request for shared active query contexts', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const activeQuery = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
    });
    const secondObserver = new QueryObserver<Attributions>(queryClient, {
      queryKey: activeQuery.queryKey,
      queryFn: () => promiseOf({ a: attribution('a', 'old') }),
      staleTime: Infinity,
    });
    const unsubscribeSecond = secondObserver.subscribe(() => undefined);
    const fetchAttributions = vi.fn(() =>
      promiseOf({ a: attribution('a', 'updated') }),
    );

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions),
    );

    expect(fetchAttributions).toHaveBeenCalledTimes(1);
    unsubscribeSecond();
    activeQuery.unsubscribe();
    queryClient.clear();
  });

  it('falls back to exact invalidation when targeted fetching fails', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const { unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, () =>
        Promise.reject(new Error('targeted request failed')),
      ),
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['backend', 'listAttributions', params],
      exact: true,
    });
    unsubscribe();
    queryClient.clear();
  });

  it('does not repopulate a cache after the query is cleared and recreated', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
    });
    let resolveTargeted: ((value: Attributions) => void) | undefined;

    const reconciliation = enqueueAttributionListReconciliation(
      createOptions(
        queryClient,
        () =>
          new Promise<Attributions>((resolve) => {
            resolveTargeted = resolve;
          }),
      ),
    );

    await Promise.resolve();
    queryClient.clear();
    queryClient.setQueryData(queryKey, { a: attribution('a', 'new') });
    resolveTargeted?.({ a: attribution('a', 'stale') });
    await reconciliation;

    expect(queryClient.getQueryData(queryKey)).toEqual({
      a: attribution('a', 'new'),
    });
    unsubscribe();
    queryClient.clear();
  });

  it('continues queued reconciliations after an earlier targeted fallback', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
    });
    const fetchAttributions = vi
      .fn<ReconcileAttributionListsOptions['fetchAttributions']>()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce({ a: attribution('a', 'updated') });

    await Promise.all([
      enqueueAttributionListReconciliation(
        createOptions(queryClient, fetchAttributions),
      ),
      enqueueAttributionListReconciliation(
        createOptions(queryClient, fetchAttributions),
      ),
    ]);

    expect(fetchAttributions).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(queryKey)).toEqual({
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
      a: attribution('a', 'updated'),
    });
    unsubscribe();
    queryClient.clear();
  });

  it('updates indirectly reclassified rows and newly matching rows', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      parent: { ...attribution('parent', 'parent'), relation: 'parents' },
      unchanged: attribution('unchanged', 'unchanged'),
      spare: attribution('spare', 'spare'),
    });

    await enqueueAttributionListReconciliation(
      createOptions(
        queryClient,
        () =>
          promiseOf({
            parent: {
              ...attribution('parent', 'parent'),
              relation: 'unrelated',
            },
            local: { ...attribution('local', 'local'), relation: 'resource' },
          }),
        ['parent', 'local'],
      ),
    );

    expect(queryClient.getQueryData<Attributions>(queryKey)).toMatchObject({
      parent: { relation: 'unrelated' },
      local: { relation: 'resource' },
      unchanged: { packageName: 'unchanged' },
    });
    unsubscribe();
    queryClient.clear();
  });

  it('continues with other active queries after one targeted fetch fails', async () => {
    const queryClient = new QueryClient();
    const manual = addActiveQuery(
      queryClient,
      { external: false },
      {
        a: attribution('a', 'manual'),
        b: attribution('b', 'unchanged'),
        d: attribution('d', 'also unchanged'),
      },
    );
    const external = addActiveQuery(
      queryClient,
      { external: true },
      {
        a: attribution('a', 'external'),
        b: attribution('b', 'unchanged'),
        d: attribution('d', 'also unchanged'),
      },
    );
    const fetchAttributions = vi.fn((params: ListAttributionsParams) =>
      params.external
        ? promiseOf({ a: attribution('a', 'updated external') })
        : Promise.reject(new Error('manual targeted fetch failed')),
    );

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions),
    );

    expect(fetchAttributions).toHaveBeenCalledTimes(2);
    expect(
      queryClient.getQueryData<Attributions>(external.queryKey)?.a,
    ).toMatchObject({ packageName: 'updated external' });
    external.unsubscribe();
    manual.unsubscribe();
    queryClient.clear();
  });

  it('rejects a failed exact fallback without poisoning the queue', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
      b: attribution('b', 'unchanged'),
      d: attribution('d', 'also unchanged'),
    });
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValueOnce(
      new Error('exact fallback failed'),
    );

    await expect(
      enqueueAttributionListReconciliation(
        createOptions(queryClient, () =>
          Promise.reject(new Error('targeted fetch failed')),
        ),
      ),
    ).rejects.toThrow('Failed to reconcile attribution lists');

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, () =>
        promiseOf({ a: attribution('a', 'updated') }),
      ),
    );
    expect(queryClient.getQueryData<Attributions>(queryKey)?.a).toMatchObject({
      packageName: 'updated',
    });
    unsubscribe();
    queryClient.clear();
  });

  it('fetches large affected sets in bounded batches', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const cachedAttributions = Object.fromEntries(
      Array.from({ length: 502 }, (_, index) => [
        `id-${index}`,
        attribution(`id-${index}`, `package-${index}`),
      ]),
    );
    const affectedAttributionUuids = Object.keys(cachedAttributions).slice(
      0,
      501,
    );
    const { unsubscribe } = addActiveQuery(
      queryClient,
      params,
      cachedAttributions,
    );
    const fetchAttributions = vi.fn<
      ReconcileAttributionListsOptions['fetchAttributions']
    >(() => promiseOf({}));

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions, affectedAttributionUuids),
    );

    expect(fetchAttributions).toHaveBeenCalledTimes(2);
    expect(
      fetchAttributions.mock.calls.map(([call]) => call.uuids?.length),
    ).toEqual([500, 1]);
    unsubscribe();
    queryClient.clear();
  });

  it('refetches the exact query when targeting is not cheaper', async () => {
    const queryClient = new QueryClient();
    const params = { external: false } satisfies ListAttributionsParams;
    const { queryKey, unsubscribe } = addActiveQuery(queryClient, params, {
      a: attribution('a', 'old'),
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const fetchAttributions = vi.fn(() =>
      promiseOf({ a: attribution('a', 'updated') }),
    );

    await enqueueAttributionListReconciliation(
      createOptions(queryClient, fetchAttributions, ['a']),
    );

    expect(fetchAttributions).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey,
      exact: true,
    });
    unsubscribe();
    queryClient.clear();
  });
});
