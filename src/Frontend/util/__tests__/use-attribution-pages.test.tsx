// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  renderHook as nativeRenderHook,
  waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';

import { executeCommand } from '../../../ElectronBackend/api/commands';
import type {
  AttributionResultSetCriteria,
  AttributionResultSetScope,
  SortOption,
} from '../../../shared/attribution-result-set';
import { faker } from '../../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../../test-helpers/general-test-helpers';
import { createTestStore, renderHook } from '../../test-helpers/render';
import {
  getAttributionPageQueryKey,
  type InfiniteAttributionData,
} from '../attribution-page-query';
import { useAttributionPages } from '../use-attribution-pages';
import { useAuditAttributionsList } from '../use-audit-attributions-list';

const criteria: AttributionResultSetCriteria = {
  external: false,
  filters: [],
  search: '',
  valueFilters: {},
  resourcePathForRelationships: '',
  showResolved: true,
  excludeUnrelated: false,
};

const sort: SortOption = 'alphabetically';

describe('useAttributionPages', () => {
  beforeEach(() => {
    vi.mocked(window.electronAPI.api).mockClear();
  });

  afterEach(() => {
    vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
  });

  it('sends only base criteria to relation counts', async () => {
    const attribution = faker.opossum.packageInfo();
    await renderHook(
      () =>
        useAuditAttributionsList({
          criteria,
          relation: 'unrelated',
          sort,
          includeReadonly: false,
        }),
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: { [attribution.id]: attribution },
        }),
      },
    );

    await waitFor(() =>
      expect(window.electronAPI.api).toHaveBeenCalledWith(
        'listAttributionRelationCounts',
        criteria,
      ),
    );
  });

  it('pages an unscoped result set without requesting relation counts', async () => {
    const attribution = faker.opossum.packageInfo();
    await renderHook(
      () =>
        useAttributionPages({
          criteria,
          scope: { mode: 'all' },
          sort,
          includeReadonly: false,
        }),
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: { [attribution.id]: attribution },
        }),
      },
    );

    await waitFor(() =>
      expect(window.electronAPI.api).toHaveBeenCalledWith(
        'listAttributionsPage',
        expect.objectContaining({
          scope: { mode: 'all' },
          offset: 0,
          limit: 200,
        }),
      ),
    );
    expect(window.electronAPI.api).not.toHaveBeenCalledWith(
      'listAttributionRelationCounts',
      criteria,
    );
  });

  it('deduplicates concurrent next-page requests', async () => {
    const attributions = Object.fromEntries(
      Array.from({ length: 201 }, () => {
        const attribution = faker.opossum.packageInfo();
        return [attribution.id, attribution];
      }),
    );
    let releaseNextPage: (() => void) | undefined;
    const nextPageBlocked = new Promise<void>((resolve) => {
      releaseNextPage = resolve;
    });
    const api = vi.mocked(window.electronAPI.api);
    api.mockImplementation(async (command, params) => {
      if (command === 'listAttributionsPage' && params !== undefined) {
        const offset = 'offset' in params ? params.offset : 0;
        if (offset === 200) {
          await nextPageBlocked;
        }
        const entries = Object.entries(attributions);
        return {
          result: {
            attributions: Object.fromEntries(
              entries.slice(offset, offset + 200),
            ),
            offset,
            limit: 200,
            hasNextPage: offset === 0,
          },
        };
      }
      return executeCommand(command, params);
    });

    const { result } = await renderHook(
      () =>
        useAttributionPages({
          criteria,
          scope: { mode: 'all' },
          sort,
          includeReadonly: false,
        }),
      {
        data: getParsedInputFileEnrichedWithTestData({}),
      },
    );

    await waitFor(() =>
      expect(
        api.mock.calls.filter(
          ([command, params]) =>
            command === 'listAttributionsPage' &&
            params !== undefined &&
            'offset' in params &&
            params.offset === 0,
        ),
      ).toHaveLength(1),
    );
    await waitFor(() => {
      expect(result.current.attributions).not.toBeNull();
      expect(result.current.hasNextPage).toBe(true);
    });
    let firstFetch: Promise<unknown> | undefined;
    let secondFetch: Promise<unknown> | undefined;
    act(() => {
      firstFetch = result.current.fetchNextPage();
      secondFetch = result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect(
        api.mock.calls.filter(
          ([command, params]) =>
            command === 'listAttributionsPage' &&
            params !== undefined &&
            'offset' in params &&
            params.offset === 200,
        ),
      ).toHaveLength(1),
    );

    releaseNextPage?.();
    await Promise.all([firstFetch, secondFetch]);
  });

  it('sends navigation without relation or offset', async () => {
    const attribution = faker.opossum.packageInfo();
    const targetAttributionUuid = attribution.id;
    await renderHook(
      () =>
        useAttributionPages({
          criteria,
          scope: { mode: 'relation', relation: 'unrelated' },
          sort,
          includeReadonly: false,
          targetAttributionUuid,
          navigationScope: 'targetRelation',
        }),
      {
        data: getParsedInputFileEnrichedWithTestData({
          manualAttributions: { [targetAttributionUuid]: attribution },
        }),
      },
    );

    await waitFor(() => {
      expect(window.electronAPI.api).toHaveBeenCalledWith('locateAttribution', {
        ...criteria,
        sort,
        includeReadonly: false,
        targetAttributionUuid,
        limit: 200,
        navigationScope: 'targetRelation',
      });
    });
  });

  it('refreshes a seeded navigation prefix after the target leaves the page', async () => {
    const targetAttributionUuid = 'target';
    const oldAttribution = {
      ...faker.opossum.packageInfo(),
      id: targetAttributionUuid,
      packageName: 'old',
    };
    const newAttribution = { ...oldAttribution, packageName: 'new' };
    const oldPage = {
      attributions: { [targetAttributionUuid]: oldAttribution },
      offset: 0,
      limit: 200,
      hasNextPage: false,
    };
    const emptyPage = { ...oldPage, attributions: {} };
    const newPage = {
      ...oldPage,
      attributions: { [targetAttributionUuid]: newAttribution },
    };
    const oldLocateResult = {
      found: true as const,
      targetRelation: 'resource' as const,
      prefix: oldPage,
    };
    const newLocateResult = {
      ...oldLocateResult,
      prefix: newPage,
    };
    let locateCallCount = 0;
    let pageCallCount = 0;
    let resolveLocateRefresh = () => {};
    const locateRefresh = new Promise<void>((resolve) => {
      resolveLocateRefresh = resolve;
    });
    let resolvePageRefresh = () => {};
    const pageRefresh = new Promise<void>((resolve) => {
      resolvePageRefresh = resolve;
    });
    const api = vi.mocked(window.electronAPI.api);
    api.mockImplementation(async (command, params) => {
      if (command === 'locateAttribution') {
        locateCallCount += 1;
        if (locateCallCount > 1) {
          await locateRefresh;
          return { result: newLocateResult };
        }
        return { result: oldLocateResult };
      }
      if (command === 'listAttributionsPage') {
        pageCallCount += 1;
        if (pageCallCount === 1) {
          return { result: oldPage };
        }
        if (pageCallCount === 2) {
          return { result: emptyPage };
        }
        await pageRefresh;
        return { result: newPage };
      }
      return executeCommand(command, params);
    });

    const scope: AttributionResultSetScope = {
      mode: 'relation',
      relation: 'resource',
    };
    const pageQueryKey = getAttributionPageQueryKey({
      ...criteria,
      scope,
      sort,
      includeReadonly: false,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const store = await createTestStore(
      getParsedInputFileEnrichedWithTestData({
        manualAttributions: { [targetAttributionUuid]: oldAttribution },
      }),
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    );
    const hook = () =>
      useAttributionPages({
        criteria,
        scope,
        sort,
        includeReadonly: false,
        targetAttributionUuid,
        navigationScope: 'targetRelation',
      });
    const { result, unmount } = nativeRenderHook(hook, { wrapper });

    await waitFor(() =>
      expect(result.current.attributions?.[targetAttributionUuid]).toEqual(
        oldAttribution,
      ),
    );

    await queryClient.invalidateQueries({ queryKey: pageQueryKey });
    await waitFor(() => expect(locateCallCount).toBe(2));
    expect(queryClient.getQueryData(pageQueryKey)).toEqual({
      pages: [emptyPage],
      pageParams: [{ offset: 0, limit: 200 }],
    });

    unmount();
    const { unmount: unmountRemountedHook } = nativeRenderHook(hook, {
      wrapper,
    });
    await waitFor(() => expect(pageCallCount).toBe(3));
    expect(
      queryClient.getQueryData<InfiniteAttributionData>(pageQueryKey)?.pages[0]
        .attributions,
    ).toEqual({});

    act(() => resolveLocateRefresh());
    await waitFor(() =>
      expect(
        queryClient.getQueryData<InfiniteAttributionData>(pageQueryKey)
          ?.pages[0].attributions[targetAttributionUuid],
      ).toEqual(newAttribution),
    );

    act(() => resolvePageRefresh());
    unmountRemountedHook();
  });
});
