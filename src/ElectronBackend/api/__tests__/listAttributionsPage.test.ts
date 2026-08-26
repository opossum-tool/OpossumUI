// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { listAttributions } from '../listAttributions';
import {
  getAttributionSelectionSummary,
  listAttributionRelationCounts,
  listAttributionsPage,
} from '../listAttributionsPage';

describe('listAttributionsPage', () => {
  beforeEach(async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent', '/parent/resource', '/other']),
      manualAttributions: {
        attributions: {
          resourceOne: {
            id: 'resourceOne',
            criticality: Criticality.None,
            packageName: 'resourceOne',
          },
          resourceTwo: { id: 'resourceTwo', criticality: Criticality.None },
          child: { id: 'child', criticality: Criticality.None },
          parent: { id: 'parent', criticality: Criticality.None },
          unrelated: { id: 'unrelated', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/resource': ['resourceOne', 'resourceTwo'],
          '/parent': ['parent'],
          '/other': ['resourceTwo', 'unrelated'],
        },
        attributionsToResources: {},
      },
    });
  });

  it('returns a page for the requested relation without counting other relations', async () => {
    const result = await listAttributionsPage({
      external: false,
      resourcePathForRelationships: '/parent/resource',
      relation: 'resource',
      offset: 0,
      limit: 1,
    });

    expect(Object.keys(result.result.attributions)).toHaveLength(1);
    expect(result.result.hasNextPage).toBe(true);
  });

  it('applies exclusions before paginating a preview', async () => {
    const result = await listAttributionsPage({
      external: false,
      resourcePathForRelationships: '/parent/resource',
      relation: 'resource',
      excludedAttributionUuids: ['resourceOne'],
      offset: 0,
      limit: 1,
    });

    expect(Object.keys(result.result.attributions)).toEqual(['resourceTwo']);
    expect(result.result.hasNextPage).toBe(false);
  });

  it('returns relation counts independently of page hydration', async () => {
    const counts = await listAttributionRelationCounts({
      external: false,
      resourcePathForRelationships: '/parent/resource',
    });

    expect(counts.result).toEqual({
      resource: { visibleCount: 2, editableCount: 2 },
      unrelated: { visibleCount: 3, editableCount: 3 },
    });
  });

  it('concatenates into the same relation-specific order as the full query', async () => {
    const props = {
      external: false,
      resourcePathForRelationships: '/parent/resource',
      relation: 'resource' as const,
      sort: 'criticality' as const,
    };
    const full = await listAttributions(props);
    const firstPage = await listAttributionsPage({
      ...props,
      offset: 0,
      limit: 1,
    });
    const secondPage = await listAttributionsPage({
      ...props,
      offset: 1,
      limit: 1,
    });

    const fullRelationIds = Object.entries(full.result)
      .filter(([, attribution]) => attribution.relation === 'resource')
      .map(([id]) => id);
    const pagedIds = [firstPage, secondPage].flatMap((page) =>
      Object.keys(page.result.attributions),
    );

    expect(pagedIds).toEqual(fullRelationIds);
    expect(secondPage.result.hasNextPage).toBe(false);
  });

  it('supports search, empty results, and final partial pages', async () => {
    const searchResult = await listAttributionsPage({
      external: false,
      search: 'resourceOne',
      relation: 'resource',
      resourcePathForRelationships: '/parent/resource',
      offset: 0,
      limit: 2,
    });
    expect(Object.keys(searchResult.result.attributions)).toEqual([
      'resourceOne',
    ]);
    expect(searchResult.result.hasNextPage).toBe(false);

    const emptyResult = await listAttributionsPage({
      external: false,
      search: 'does-not-exist',
      relation: 'resource',
      offset: 0,
      limit: 2,
    });
    expect(emptyResult.result.attributions).toEqual({});
    expect(emptyResult.result.hasNextPage).toBe(false);
  });

  it('summarizes a query-wide selection with exclusions', async () => {
    const summary = await getAttributionSelectionSummary({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: [],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/resource',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: ['resourceOne'],
      },
    });

    expect(summary.result).toMatchObject({
      selectedCount: 1,
      writableLinkedResourceCount: 2,
      allLinkedToSelectedResource: true,
    });
  });
});
