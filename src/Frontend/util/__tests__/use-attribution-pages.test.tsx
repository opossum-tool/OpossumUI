// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { executeCommand } from '../../../ElectronBackend/api/commands';
import type {
  AttributionResultSetCriteria,
  SortOption,
} from '../../../shared/attribution-result-set';
import { faker } from '../../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../../test-helpers/general-test-helpers';
import { renderHook } from '../../test-helpers/render';
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
});
