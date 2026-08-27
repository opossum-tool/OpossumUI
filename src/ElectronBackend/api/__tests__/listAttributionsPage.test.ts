// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../../shared/attribution-filters';
import type {
  AttributionPageRequest,
  AttributionRelationCountRequest,
} from '../../../shared/attribution-result-set';
import { Criticality, type PackageInfo } from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';
import { getAttributions } from '../getAttributions';
import {
  getAttributionSelectionSummary,
  listAttributionPreview,
  listAttributionRelationCounts,
  listAttributionsPage,
  locateAttribution,
  resolveAttributionSelection,
} from '../listAttributionsPage';

describe('listAttributionsPage', () => {
  const defaultCriteria = {
    external: false,
    filters: [],
    search: '',
    valueFilters: {},
    resourcePathForRelationships: '',
    showResolved: false,
    excludeUnrelated: false,
  } satisfies AttributionRelationCountRequest;
  const listPage = (props: Partial<AttributionPageRequest>) =>
    listAttributionsPage({
      ...defaultCriteria,
      scope: { mode: 'relation', relation: 'resource' },
      sort: 'alphabetically',
      includeReadonly: false,
      offset: 0,
      limit: 200,
      ...props,
    });
  const allPage = (props: Partial<AttributionPageRequest>) =>
    listAttributionsPage({
      ...defaultCriteria,
      scope: { mode: 'all' },
      sort: 'alphabetically',
      includeReadonly: false,
      offset: 0,
      limit: 200,
      ...props,
    });
  const relationCounts = (props: Partial<AttributionRelationCountRequest>) =>
    listAttributionRelationCounts({ ...defaultCriteria, ...props });
  const preview = (
    props: Partial<Parameters<typeof listAttributionPreview>[0]>,
  ) =>
    listAttributionPreview({
      ...defaultCriteria,
      relation: 'resource',
      excludedAttributionUuids: [],
      offset: 0,
      limit: 200,
      ...props,
    });
  const locate = (props: Partial<Parameters<typeof locateAttribution>[0]>) =>
    locateAttribution({
      ...defaultCriteria,
      sort: 'alphabetically',
      includeReadonly: false,
      targetAttributionUuid: 'target',
      limit: 200,
      navigationScope: 'targetRelation',
      ...props,
    });

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
          resourceTwo: {
            id: 'resourceTwo',
            criticality: Criticality.None,
            packageName: 'resourceTwo',
          },
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

  it('loads an explicit UUID batch without applying result-set filters', async () => {
    const result = await getAttributions({
      attributionUuids: ['missing', 'unrelated', 'resourceOne', 'unrelated'],
      resourcePathForRelationships: '/parent/resource',
    });

    expect(Object.keys(result.result)).toEqual(['unrelated', 'resourceOne']);
    expect(result.result.resourceOne.relation).toBe('resource');
    expect(result.result.unrelated.relation).toBe('unrelated');
  });

  it('returns a page for the requested relation without counting other relations', async () => {
    const result = await listPage({
      external: false,
      resourcePathForRelationships: '/parent/resource',
      scope: { mode: 'relation', relation: 'resource' },
      offset: 0,
      limit: 1,
    });

    expect(Object.keys(result.result.attributions)).toHaveLength(1);
    expect(result.result.hasNextPage).toBe(true);
  });

  it('applies exclusions before paginating a preview', async () => {
    const result = await preview({
      resourcePathForRelationships: '/parent/resource',
      excludedAttributionUuids: ['resourceOne'],
      offset: 0,
      limit: 1,
    });

    expect(Object.keys(result.result.attributions)).toEqual(['resourceTwo']);
    expect(result.result.hasNextPage).toBe(false);
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

    const counts = await relationCounts({
      external: false,
      resourcePathForRelationships: '/parent',
    });

    expect(counts.result.children).toEqual({
      visibleCount: 3,
      editableCount: 1,
    });
  });

  it('loads the prefix through a target attribution in one request', async () => {
    const full = await listPage({
      external: false,
      resourcePathForRelationships: '/parent/resource',
      scope: { mode: 'relation', relation: 'resource' },
      offset: 0,
      limit: 200,
    });
    const expectedIds = Object.keys(full.result.attributions);
    const result = await locate({
      resourcePathForRelationships: '/parent/resource',
      targetAttributionUuid: 'resourceTwo',
    });

    expect(result.result).toMatchObject({
      found: true,
      targetRelation: 'resource',
    });
    const prefix = 'prefix' in result.result ? result.result.prefix : undefined;
    expect(Object.keys(prefix?.attributions ?? {})).toEqual(expectedIds);
    expect(prefix?.hasNextPage).toBe(false);
  });

  it('uses the complete result-set offset for all-scope navigation', async () => {
    const allPage = await listAttributionsPage({
      ...defaultCriteria,
      scope: { mode: 'all' },
      sort: 'alphabetically',
      includeReadonly: false,
      offset: 0,
      limit: 200,
      resourcePathForRelationships: '/parent/resource',
    });
    const allIds = Object.keys(allPage.result.attributions);
    const result = await locate({
      resourcePathForRelationships: '/parent/resource',
      targetAttributionUuid: 'resourceTwo',
      navigationScope: 'all',
    });

    expect(result.result).toMatchObject({
      found: true,
      targetRelation: 'resource',
    });
    const prefix = 'prefix' in result.result ? result.result.prefix : undefined;
    expect(Object.keys(prefix?.attributions ?? {})).toEqual(allIds);
  });

  it('reports a target that does not match the list criteria', async () => {
    const result = await locate({
      search: 'does-not-exist',
      resourcePathForRelationships: '/parent/resource',
      targetAttributionUuid: 'resourceTwo',
      limit: 1,
    });

    expect(result.result).toEqual({ found: false });
  });

  it('locates a target in a different relation than the requested relation', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/parent/resource',
        '/parent/resource/child',
      ]),
      manualAttributions: {
        attributions: {
          targetChild: { id: 'targetChild', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/resource/child': ['targetChild'],
        },
        attributionsToResources: {},
      },
    });
    const result = await locate({
      resourcePathForRelationships: '/parent/resource',
      targetAttributionUuid: 'targetChild',
    });

    expect(result.result).toMatchObject({
      found: true,
      targetRelation: 'children',
    });
    const prefix = 'prefix' in result.result ? result.result.prefix : undefined;
    expect(prefix?.limit).toBe(200);
    expect(prefix?.attributions.targetChild.relation).toBe('children');
  });

  it('loads the complete batched prefix for a target beyond the first page', async () => {
    const attributions = Object.fromEntries(
      Array.from({ length: 250 }, (_, index) => {
        const id = `attribution-${index.toString().padStart(3, '0')}`;
        return [id, { id, criticality: Criticality.None }];
      }),
    );
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions,
        resourcesToAttributions: {
          '/resource': Object.keys(attributions),
        },
        attributionsToResources: {},
      },
    });

    const result = await locate({
      resourcePathForRelationships: '/resource',
      targetAttributionUuid: 'attribution-200',
    });

    expect(result.result).toMatchObject({ found: true });
    const prefix = 'prefix' in result.result ? result.result.prefix : undefined;
    expect(prefix?.limit).toBe(400);
    expect(Object.keys(prefix?.attributions ?? {})).toHaveLength(250);
    expect(prefix?.attributions['attribution-200']).toBeDefined();
  });

  it('concatenates into the same relation-specific order as the full query', async () => {
    const props = {
      external: false,
      resourcePathForRelationships: '/parent/resource',
      scope: { mode: 'relation', relation: 'resource' as const },
      sort: 'criticality' as const,
    } as const;
    const full = await listPage({ ...props, offset: 0, limit: 200 });
    const firstPage = await listPage({
      ...props,
      offset: 0,
      limit: 1,
    });
    const secondPage = await listPage({
      ...props,
      offset: 1,
      limit: 1,
    });

    const fullRelationIds = Object.keys(full.result.attributions);
    const pagedIds = [firstPage, secondPage].flatMap((page) =>
      Object.keys(page.result.attributions),
    );

    expect(pagedIds).toEqual(fullRelationIds);
    expect(secondPage.result.hasNextPage).toBe(false);
  });

  it('supports search, empty results, and final partial pages', async () => {
    const searchResult = await listPage({
      external: false,
      search: 'resourceOne',
      scope: { mode: 'relation', relation: 'resource' },
      resourcePathForRelationships: '/parent/resource',
      offset: 0,
      limit: 2,
    });
    expect(Object.keys(searchResult.result.attributions)).toEqual([
      'resourceOne',
    ]);
    expect(searchResult.result.hasNextPage).toBe(false);

    const emptyResult = await listPage({
      external: false,
      search: 'does-not-exist',
      scope: { mode: 'relation', relation: 'resource' },
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

  it('keeps page, counts, resolution, preview, and navigation on one result set', async () => {
    const criteria = {
      ...defaultCriteria,
      filters: ['thirdParty' as const],
      search: 'resource',
      resourcePathForRelationships: '/parent/resource',
      showResolved: false,
      excludeUnrelated: true,
    };
    const page = await listPage({
      ...criteria,
      scope: { mode: 'relation', relation: 'resource' },
      sort: 'alphabetically',
      includeReadonly: false,
      offset: 0,
      limit: 200,
    });
    const counts = await relationCounts(criteria);
    const selection = {
      mode: 'allMatching' as const,
      query: { ...criteria, relation: 'resource' as const },
      excludedAttributionUuids: [],
    };
    const resolved = await getDb()
      .transaction()
      .execute((trx) => resolveAttributionSelection(trx, selection));
    const summary = await getAttributionSelectionSummary({ selection });
    const preview = await listAttributionPreview({
      ...selection.query,
      excludedAttributionUuids: ['resourceOne'],
      offset: 0,
      limit: 200,
    });
    const navigation = await locate({
      ...criteria,
      targetAttributionUuid: 'resourceTwo',
    });

    expect(Object.keys(page.result.attributions)).toEqual([
      'resourceOne',
      'resourceTwo',
    ]);
    expect(counts.result.resource).toMatchObject({
      visibleCount: 2,
      editableCount: 2,
    });
    expect(resolved).toEqual(['resourceOne', 'resourceTwo']);
    expect(summary.result.selectedCount).toBe(2);
    expect(Object.keys(preview.result.attributions)).toEqual(['resourceTwo']);
    expect(navigation.result).toMatchObject({
      found: true,
      targetRelation: 'resource',
    });
  });

  it('preserves the complete readonly visibility matrix in the all scope', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/parent/readonly/file.ts',
        '/parent/writable/file.ts',
        '/other/readonly/file.ts',
      ]),
      manualAttributions: {
        attributions: {
          unlinked: { id: 'unlinked', criticality: Criticality.None },
          readonly: { id: 'readonly', criticality: Criticality.None },
          relatedReadonly: {
            id: 'relatedReadonly',
            criticality: Criticality.None,
          },
          unrelatedReadonly: {
            id: 'unrelatedReadonly',
            criticality: Criticality.None,
          },
          writable: { id: 'writable', criticality: Criticality.None },
          mixed: { id: 'mixed', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/readonly/file.ts': ['readonly', 'relatedReadonly', 'mixed'],
          '/parent/writable/file.ts': ['writable', 'mixed'],
          '/other/readonly/file.ts': ['unrelatedReadonly'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [
        { path: '/parent/readonly', readonly: true },
        { path: '/other/readonly', readonly: true },
      ],
    });

    const defaultPage = await allPage({
      external: false,
      resourcePathForRelationships: '',
    });
    expect(Object.keys(defaultPage.result.attributions)).toEqual(
      expect.arrayContaining(['mixed', 'unlinked', 'writable']),
    );
    expect(Object.keys(defaultPage.result.attributions)).toHaveLength(3);
    expect(Object.keys(defaultPage.result.attributions)).not.toContain(
      'readonly',
    );
    expect(Object.keys(defaultPage.result.attributions)).not.toContain(
      'relatedReadonly',
    );

    const relatedPage = await allPage({
      external: false,
      resourcePathForRelationships: '/parent',
      includeReadonly: true,
    });
    expect(relatedPage.result.attributions.relatedReadonly).toMatchObject({
      resourceAccess: 'readonly',
      relation: 'children',
    });
    expect(relatedPage.result.attributions.writable).toMatchObject({
      resourceAccess: 'writable',
      relation: 'children',
    });
    expect(relatedPage.result.attributions.unrelatedReadonly).toBeUndefined();

    const readonlyResourcePage = await allPage({
      external: false,
      resourcePathForRelationships: '/parent/readonly/file.ts',
      includeReadonly: true,
      excludeUnrelated: true,
    });
    expect(readonlyResourcePage.result.attributions.readonly).toBeDefined();
    expect(readonlyResourcePage.result.attributions.writable).toBeUndefined();
  });

  it.each([
    {
      name: 'search',
      filters: [],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          packageName: 'search-me',
        },
        other: {
          id: 'other',
          criticality: Criticality.None,
          packageName: 'other',
        },
      },
      search: 'search-me',
      expected: ['selected'],
    },
    {
      name: 'selected license',
      filters: [],
      valueFilters: { license: 'MIT' },
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          licenseName: 'MIT',
        },
        other: {
          id: 'other',
          criticality: Criticality.None,
          licenseName: 'Apache-2.0',
        },
      },
      expected: ['selected'],
    },
    {
      name: 'needs follow-up',
      filters: ['needsFollowUp'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          followUp: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'pre-selected',
      filters: ['preSelected'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          preSelected: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'excluded from notice',
      filters: ['excludedFromNotice'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          excludeFromNotice: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'low confidence',
      filters: ['lowConfidence'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          attributionConfidence: 59,
        },
        other: {
          id: 'other',
          criticality: Criticality.None,
          attributionConfidence: 60,
        },
      },
      expected: ['selected'],
    },
    {
      name: 'first-party',
      filters: ['firstParty'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          firstParty: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'third-party',
      filters: ['thirdParty'],
      valueFilters: {},
      attributions: {
        selected: { id: 'selected', criticality: Criticality.None },
        other: {
          id: 'other',
          criticality: Criticality.None,
          firstParty: true,
        },
      },
      expected: ['selected'],
    },
    {
      name: 'needs review',
      filters: ['needsReview'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          needsReview: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'currently preferred',
      filters: ['currentlyPreferred'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          preferred: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'previously preferred',
      filters: ['previouslyPreferred'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          wasPreferred: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'modified preferred',
      filters: ['modifiedPreferred'],
      valueFilters: {},
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          originalAttributionWasPreferred: true,
        },
        other: { id: 'other', criticality: Criticality.None },
      },
      expected: ['selected'],
    },
    {
      name: 'incomplete coordinate',
      filters: [],
      valueFilters: { incompleteCoordinates: 'url' },
      attributions: {
        selected: { id: 'selected', criticality: Criticality.None },
        other: {
          id: 'other',
          criticality: Criticality.None,
          packageName: 'package',
          packageType: 'npm',
          url: 'https://example.com',
        },
      },
      expected: ['selected'],
    },
    {
      name: 'incomplete legal',
      filters: [],
      valueFilters: { incompleteLegal: 'copyright' },
      attributions: {
        selected: { id: 'selected', criticality: Criticality.None },
        other: {
          id: 'other',
          criticality: Criticality.None,
          copyright: '(c) 2024',
          licenseName: 'MIT',
        },
      },
      expected: ['selected'],
    },
    {
      name: 'combined license and incomplete coordinate',
      filters: [],
      valueFilters: { license: 'MIT', incompleteCoordinates: 'any' },
      attributions: {
        selected: {
          id: 'selected',
          criticality: Criticality.None,
          licenseName: 'MIT',
        },
        other: {
          id: 'other',
          criticality: Criticality.None,
          licenseName: 'MIT',
          packageName: 'package',
          packageType: 'npm',
          url: 'https://example.com',
        },
        differentLicense: {
          id: 'differentLicense',
          criticality: Criticality.None,
          licenseName: 'Apache-2.0',
        },
      },
      expected: ['selected'],
    },
    {
      name: 'any incomplete legal attribute',
      filters: [],
      valueFilters: { incompleteLegal: 'any' },
      attributions: {
        selected: { id: 'selected', criticality: Criticality.None },
        other: {
          id: 'other',
          criticality: Criticality.None,
          copyright: '(c) 2024',
          licenseName: 'MIT',
        },
      },
      expected: ['selected'],
    },
  ] satisfies Array<{
    name: string;
    filters: Array<AttributionFilterKey>;
    valueFilters: AttributionValueFilters;
    attributions: Record<string, PackageInfo>;
    search?: string;
    expected: Array<string>;
  }>)('$name works in the all scope', async (scenario) => {
    const scenarioAttributions = scenario.attributions as Record<
      string,
      PackageInfo
    >;
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: scenarioAttributions,
        resourcesToAttributions: {
          '/resource': Object.keys(scenarioAttributions),
        },
        attributionsToResources: {},
      },
    });

    const result = await allPage({
      external: false,
      filters: scenario.filters,
      search: scenario.search ?? '',
      valueFilters: scenario.valueFilters,
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result.result.attributions)).toEqual(scenario.expected);
  });

  it('applies shared filters and sorting in a relation scope', async () => {
    const attributions = {
      selected: {
        id: 'selected',
        criticality: Criticality.High,
        firstParty: false,
        packageName: 'a',
      },
      other: {
        id: 'other',
        criticality: Criticality.None,
        firstParty: true,
        packageName: 'b',
      },
      low: {
        id: 'low',
        criticality: Criticality.None,
        firstParty: false,
        packageName: 'c',
      },
    } satisfies Record<string, PackageInfo>;
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions,
        resourcesToAttributions: { '/resource': Object.keys(attributions) },
        attributionsToResources: {},
      },
    });

    const result = await listPage({
      external: false,
      filters: ['thirdParty'],
      resourcePathForRelationships: '/resource',
      scope: { mode: 'relation', relation: 'resource' },
      sort: 'criticality',
    });

    expect(Object.keys(result.result.attributions)).toEqual([
      'selected',
      'low',
    ]);
  });

  it('hydrates explicit UUID batches without calculating relationships when omitted', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/readonly/file.ts']),
      manualAttributions: {
        attributions: {
          readonly: { id: 'readonly', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/readonly/file.ts': ['readonly'] },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });

    const result = await getAttributions({
      attributionUuids: ['readonly'],
    });

    expect(result.result.readonly).toMatchObject({
      resourceAccess: 'readonly',
    });
    expect(result.result.readonly.relation).toBeUndefined();
  });

  it('sorts all-scope pages and applies the UUID tie-breaker', async () => {
    const attributions = {
      z: {
        id: 'z',
        criticality: Criticality.Medium,
        classification: 1,
        packageName: 'same',
      },
      a: {
        id: 'a',
        criticality: Criticality.High,
        classification: 2,
        packageName: 'same',
      },
      b: {
        id: 'b',
        criticality: Criticality.None,
        classification: 3,
        packageName: 'same',
      },
    } satisfies Record<string, PackageInfo>;
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions,
        resourcesToAttributions: { '/resource': Object.keys(attributions) },
        attributionsToResources: {},
      },
    });

    const alphabetical = await allPage({
      resourcePathForRelationships: '/resource',
      sort: 'alphabetically',
    });
    const criticality = await allPage({
      resourcePathForRelationships: '/resource',
      sort: 'criticality',
    });
    const classification = await allPage({
      resourcePathForRelationships: '/resource',
      sort: 'classification',
    });

    expect(Object.keys(alphabetical.result.attributions)).toEqual([
      'a',
      'b',
      'z',
    ]);
    expect(Object.keys(criticality.result.attributions)).toEqual([
      'a',
      'z',
      'b',
    ]);
    expect(Object.keys(classification.result.attributions)).toEqual([
      'b',
      'a',
      'z',
    ]);
  });

  it('sorts occurrence by resource count and keeps page boundaries stable', async () => {
    const attributions = {
      one: { id: 'one', criticality: Criticality.None },
      two: { id: 'two', criticality: Criticality.None },
      three: { id: 'three', criticality: Criticality.None },
    } satisfies Record<string, PackageInfo>;
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource', '/other', '/third']),
      manualAttributions: {
        attributions,
        resourcesToAttributions: {
          '/resource': ['one', 'two', 'three'],
          '/other': ['two', 'three'],
          '/third': ['three'],
        },
        attributionsToResources: {},
      },
    });

    const first = await allPage({
      resourcePathForRelationships: '/',
      sort: 'occurrence',
      limit: 1,
    });
    const second = await allPage({
      resourcePathForRelationships: '/',
      sort: 'occurrence',
      offset: 1,
      limit: 1,
    });

    expect(Object.keys(first.result.attributions)).toEqual(['three']);
    expect(Object.keys(second.result.attributions)).toEqual(['two']);
  });

  it('filters resolved rows consistently in the all scope', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      externalAttributions: {
        attributions: {
          unresolved: { id: 'unresolved', criticality: Criticality.None },
          resolved: { id: 'resolved', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/resource': ['unresolved', 'resolved'],
        },
        attributionsToResources: {},
      },
      resolvedExternalAttributions: new Set(['resolved']),
    });

    const hidden = await allPage({
      external: true,
      resourcePathForRelationships: '/resource',
      showResolved: false,
    });
    const shown = await allPage({
      external: true,
      resourcePathForRelationships: '/resource',
      showResolved: true,
    });

    expect(Object.keys(hidden.result.attributions)).toEqual(['unresolved']);
    expect(Object.keys(shown.result.attributions)).toEqual([
      'resolved',
      'unresolved',
    ]);
  });
});
