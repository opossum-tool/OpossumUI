// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor } from '@testing-library/react';

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
