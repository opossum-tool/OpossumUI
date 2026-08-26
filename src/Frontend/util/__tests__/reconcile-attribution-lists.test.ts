// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryObserver } from '@tanstack/react-query';

import type { QueryParams } from '../../../ElectronBackend/api/queries';
import { type Attributions, Criticality } from '../../../shared/shared-types';
import { reconcileAttributionPages } from '../reconcile-attribution-lists';

function promiseOf<T>(value: T) {
  return Promise.resolve(value);
}

function attribution(id: string, packageName: string): Attributions[string] {
  return { id, criticality: Criticality.None, packageName };
}

describe('reconcileAttributionPages', () => {
  it('refetches the loaded prefix and replaces all loaded pages atomically', async () => {
    const queryClient = new QueryClient();
    const params = {
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '',
      showResolved: true,
      excludeUnrelated: false,
      scope: { mode: 'relation', relation: 'resource' },
      sort: 'alphabetically',
      includeReadonly: true,
      offset: 0,
      limit: 200,
    } satisfies QueryParams<'listAttributionsPage'>;
    const queryKey = ['backend', 'listAttributionsPage', params] as const;
    const page = {
      attributions: {
        a: attribution('a', 'old'),
        b: attribution('b', 'unchanged'),
      },
      offset: 0,
      limit: 200,
      hasNextPage: true,
    };
    queryClient.setQueryData(queryKey, {
      pages: [page, { ...page, offset: 200 }],
      pageParams: [
        { offset: 0, limit: 200 },
        { offset: 200, limit: 200 },
      ],
    });
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: () =>
        promiseOf({
          pages: [page],
          pageParams: [{ offset: 0, limit: 200 }],
        }),
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    const fetchPage = vi.fn(() =>
      promiseOf({
        attributions: {
          a: attribution('a', 'updated'),
          b: attribution('b', 'unchanged'),
          c: attribution('c', 'new'),
        },
        offset: 0,
        limit: 400,
        hasNextPage: false,
      }),
    );

    await reconcileAttributionPages({ queryClient, fetchPage });

    expect(fetchPage).toHaveBeenCalledWith({
      ...params,
      offset: 0,
      limit: 400,
    });
    expect(queryClient.getQueryData(queryKey)).toEqual({
      pages: [
        {
          attributions: {
            a: attribution('a', 'updated'),
            b: attribution('b', 'unchanged'),
            c: attribution('c', 'new'),
          },
          offset: 0,
          limit: 400,
          hasNextPage: false,
        },
      ],
      pageParams: [{ offset: 0, limit: 400 }],
    });
    unsubscribe();
    queryClient.clear();
  });

  it('marks inactive page queries stale without fetching', async () => {
    const queryClient = new QueryClient();
    const params = {
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '',
      showResolved: true,
      excludeUnrelated: false,
      scope: { mode: 'relation', relation: 'resource' },
      sort: 'alphabetically',
      includeReadonly: true,
      offset: 0,
      limit: 200,
    } satisfies QueryParams<'listAttributionsPage'>;
    const queryKey = ['backend', 'listAttributionsPage', params] as const;
    queryClient.setQueryData(queryKey, {
      pages: [
        {
          attributions: { a: attribution('a', 'old') },
          offset: 0,
          limit: 200,
          hasNextPage: false,
        },
      ],
      pageParams: [{ offset: 0, limit: 200 }],
    });
    const fetchPage = vi.fn(() =>
      promiseOf({
        attributions: {},
        offset: 0,
        limit: 200,
        hasNextPage: false,
      }),
    );

    await reconcileAttributionPages({ queryClient, fetchPage });

    expect(fetchPage).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it('reconciles active all-scope page queries', async () => {
    const queryClient = new QueryClient();
    const params = {
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '/',
      showResolved: false,
      excludeUnrelated: false,
      scope: { mode: 'all' },
      sort: 'criticality',
      includeReadonly: false,
      offset: 0,
      limit: 200,
    } satisfies QueryParams<'listAttributionsPage'>;
    const queryKey = ['backend', 'listAttributionsPage', params] as const;
    queryClient.setQueryData(queryKey, {
      pages: [
        {
          attributions: { a: attribution('a', 'old') },
          offset: 0,
          limit: 200,
          hasNextPage: false,
        },
      ],
      pageParams: [{ offset: 0, limit: 200 }],
    });
    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn: () =>
        promiseOf({
          pages: [],
          pageParams: [],
        }),
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    const fetchPage = vi.fn(() =>
      promiseOf({
        attributions: { a: attribution('a', 'updated') },
        offset: 0,
        limit: 200,
        hasNextPage: false,
      }),
    );

    await reconcileAttributionPages({ queryClient, fetchPage });

    expect(fetchPage).toHaveBeenCalledWith({
      ...params,
      offset: 0,
      limit: 200,
    });
    unsubscribe();
    queryClient.clear();
  });
});
