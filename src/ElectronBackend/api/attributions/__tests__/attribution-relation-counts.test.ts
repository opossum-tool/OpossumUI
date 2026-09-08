// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { listAttributionRelationCounts } from '../attribution-relation-counts';
import {
  initializeDefaultAttributionQueryTestData,
  listPage,
  relationCounts,
} from './attribution-query-test-helpers';

describe('listAttributionRelationCounts', () => {
  beforeEach(async () => {
    await initializeDefaultAttributionQueryTestData();
  });

  it('returns relation counts independently of page hydration', async () => {
    const counts = await relationCounts({
      external: false,
      resourcePathForRelationships: '/parent/resource',
    });

    expect(counts.result).toEqual({
      resource: { visibleCount: 2, editableCount: 2 },
      unrelated: { visibleCount: 3, editableCount: 3 },
    });
  });

  it('counts related readonly attributions as visible but not editable', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/parent/readonly/one.ts',
        '/parent/readonly/two.ts',
        '/parent/writable.ts',
      ]),
      manualAttributions: {
        attributions: {
          relatedReadonlyOne: {
            id: 'relatedReadonlyOne',
            criticality: Criticality.None,
          },
          relatedReadonlyTwo: {
            id: 'relatedReadonlyTwo',
            criticality: Criticality.None,
          },
          writable: { id: 'writable', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/readonly/one.ts': ['relatedReadonlyOne'],
          '/parent/readonly/two.ts': ['relatedReadonlyTwo'],
          '/parent/writable.ts': ['writable'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/parent/readonly', readonly: true }],
    });

    const counts = await listAttributionRelationCounts({
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '/parent',
      showResolved: false,
      excludeUnrelated: false,
    });

    expect(counts.result.children).toEqual({
      visibleCount: 3,
      editableCount: 1,
    });
  });

  it('returns ordered external source groups with relation counts', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      externalAttributions: {
        attributions: {
          low: {
            id: 'low',
            criticality: Criticality.None,
            source: { name: 'low' },
          },
          highSecond: {
            id: 'highSecond',
            criticality: Criticality.None,
            source: { name: 'high' },
          },
          highFirst: {
            id: 'highFirst',
            criticality: Criticality.None,
            source: { name: 'high' },
          },
        },
        resourcesToAttributions: {
          '/resource': ['low', 'highSecond', 'highFirst'],
        },
        attributionsToResources: {},
      },
      externalAttributionSources: {
        high: { name: 'High', priority: 2 },
        low: { name: 'Low', priority: 1 },
      },
    });

    const counts = await listAttributionRelationCounts({
      external: true,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '/resource',
      showResolved: true,
      excludeUnrelated: false,
    });

    expect(counts.result.resource).toEqual({
      visibleCount: 3,
      editableCount: 3,
      sourceGroups: [
        { name: 'High', visibleCount: 2, editableCount: 2 },
        { name: 'Low', visibleCount: 1, editableCount: 1 },
      ],
    });
  });

  it('uses configured priority from sources outside the filtered relation', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      externalAttributions: {
        attributions: {
          high: {
            id: 'high',
            criticality: Criticality.None,
            source: { name: 'high-low' },
          },
          low: {
            id: 'low',
            criticality: Criticality.None,
            source: { name: 'low' },
          },
        },
        resourcesToAttributions: {
          '/resource': ['high', 'low'],
        },
        attributionsToResources: {},
      },
      externalAttributionSources: {
        'high-low': { name: 'High', priority: 1 },
        'high-high': { name: 'High', priority: 3 },
        low: { name: 'Low', priority: 2 },
      },
    });

    const counts = await relationCounts({
      external: true,
      resourcePathForRelationships: '/resource',
      showResolved: true,
    });
    const page = await listPage({
      external: true,
      resourcePathForRelationships: '/resource',
      showResolved: true,
      limit: 2,
    });

    expect(
      counts.result.resource?.sourceGroups?.map(({ name }) => name),
    ).toEqual(['High', 'Low']);
    expect(Object.keys(page.result.attributions)).toEqual(['high', 'low']);
  });
});
