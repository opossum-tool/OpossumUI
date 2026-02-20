// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ParsedFileContent } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { pathsToResources } from '../../../testing/global-test-helpers';
import { initializeDb } from '../../db/initializeDb';
import { queries } from '../queries';

function makeFileContent(
  overrides: Partial<ParsedFileContent> & Pick<ParsedFileContent, 'resources'>,
): ParsedFileContent {
  return {
    metadata: { projectId: '', fileCreationDate: '' },
    config: { classifications: {} },
    manualAttributions: {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
    },
    externalAttributions: {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
    },
    frequentLicenses: { nameOrder: [], texts: {} },
    resolvedExternalAttributions: new Set(),
    attributionBreakpoints: new Set(),
    filesWithChildren: new Set(),
    baseUrlsForSources: {},
    externalAttributionSources: {},
    ...overrides,
  };
}

describe('filterCounts', () => {
  async function setupDb(options?: { resolved?: Array<string> }) {
    await initializeDb({
      metadata: { projectId: '', fileCreationDate: '' },
      resources: pathsToResources(['/parent/target/child', '/parent/sibling']),
      config: { classifications: {} },
      manualAttributions: {
        attributions: {
          'manual-parent': { id: 'manual-parent', criticality: 0 },
        },
        resourcesToAttributions: { '/parent': ['manual-parent'] },
        attributionsToResources: { 'manual-parent': ['/parent'] },
      },
      externalAttributions: {
        attributions: {
          'ext-same': {
            id: 'ext-same',
            criticality: 0,
            firstParty: true,
            licenseName: 'MIT',
          },
          'ext-descendant': {
            id: 'ext-descendant',
            criticality: 0,
            followUp: true,
            packageName: 'search-me',
          },
          'ext-ancestor': { id: 'ext-ancestor', criticality: 0 },
          'ext-unrelated': { id: 'ext-unrelated', criticality: 0 },
        },
        resourcesToAttributions: {
          '/parent/target': ['ext-same'],
          '/parent/target/child': ['ext-descendant'],
          '/parent': ['ext-ancestor'],
          '/parent/sibling': ['ext-unrelated'],
        },
        attributionsToResources: {
          'ext-same': ['/parent/target'],
          'ext-descendant': ['/parent/target/child'],
          'ext-ancestor': ['/parent'],
          'ext-unrelated': ['/parent/sibling'],
        },
      },
      frequentLicenses: { nameOrder: [], texts: {} },
      resolvedExternalAttributions: new Set(options?.resolved ?? []),
      attributionBreakpoints: new Set(),
      filesWithChildren: new Set(),
      baseUrlsForSources: {},
      externalAttributionSources: {},
    });
  }

  it('classifies attributions by relationship to selected resource', async () => {
    await setupDb();

    const { result } = await queries.filterCounts({
      external: true,
      filters: [],
      resourcePathForRelationships: '/parent/target',
    });

    expect(result.same?.total).toBe(1);
    expect(result.descendant?.total).toBe(1);
    expect(result.ancestor?.total).toBe(1);
    expect(result.unrelated?.total).toBe(1);
    expect(result.all.total).toBe(4);
    expect(result.sameOrDescendant.total).toBe(2);
  });

  it('counts filter matches correctly', async () => {
    await setupDb();

    const { result } = await queries.filterCounts({
      external: true,
      filters: [],
      resourcePathForRelationships: '/parent/target',
    });

    expect(result.all[text.filters.firstParty]).toBe(1);
    expect(result.all[text.filters.thirdParty]).toBe(3);
    expect(result.all[text.filters.needsFollowUp]).toBe(1);
  });

  it('applies active filters to narrow results', async () => {
    await setupDb();

    const { result } = await queries.filterCounts({
      external: true,
      filters: [text.filters.firstParty],
      resourcePathForRelationships: '/parent/target',
    });

    expect(result.all.total).toBe(1);
    expect(result.same?.total).toBe(1);
  });

  it('filters by license name', async () => {
    await setupDb();

    const { result } = await queries.filterCounts({
      external: true,
      filters: [],
      resourcePathForRelationships: '/parent/target',
      license: 'MIT',
    });

    expect(result.all.total).toBe(1);
    expect(result.same?.total).toBe(1);
  });

  it('filters by search term in package name', async () => {
    await setupDb();

    const { result } = await queries.filterCounts({
      external: true,
      filters: [],
      resourcePathForRelationships: '/parent/target',
      search: 'search-me',
    });

    expect(result.all.total).toBe(1);
    expect(result.descendant?.total).toBe(1);
  });

  it('excludes resolved attributions by default', async () => {
    await setupDb({ resolved: ['ext-unrelated'] });

    const { result } = await queries.filterCounts({
      external: true,
      filters: [],
      resourcePathForRelationships: '/parent/target',
    });

    expect(result.all.total).toBe(3);
    expect(result.unrelated).toBeUndefined();
  });

  it('includes resolved attributions when showResolved is true', async () => {
    await setupDb({ resolved: ['ext-unrelated'] });

    const { result } = await queries.filterCounts({
      external: true,
      filters: [],
      resourcePathForRelationships: '/parent/target',
      showResolved: true,
    });

    expect(result.all.total).toBe(4);
    expect(result.unrelated?.total).toBe(1);
  });

  it('only counts attributions matching the external flag', async () => {
    await setupDb();

    const { result } = await queries.filterCounts({
      external: false,
      filters: [],
      resourcePathForRelationships: '/parent/target',
    });

    expect(result.all.total).toBe(1);
    expect(result.ancestor?.total).toBe(1);
  });
});

describe('getNodePathsToExpand', () => {
  it('returns only the starting node when it has multiple children', async () => {
    await initializeDb(
      makeFileContent({
        resources: { src: { 'a.ts': 1, 'b.ts': 1 } },
      }),
    );

    const { result } = await queries.getNodePathsToExpand({
      fromNodePath: '/src/',
    });

    expect(result).toEqual(['/src/']);
  });

  it('follows single-child chain and stops at branching point', async () => {
    await initializeDb(
      makeFileContent({
        resources: { a: { b: { 'x.ts': 1, 'y.ts': 1 } } },
      }),
    );

    const { result } = await queries.getNodePathsToExpand({
      fromNodePath: '/a/',
    });

    expect(result).toEqual(['/a/', '/a/b/']);
  });

  it('follows single-child chain and stops at leaf', async () => {
    await initializeDb(
      makeFileContent({
        resources: { a: { b: { 'file.ts': 1 } } },
      }),
    );

    const { result } = await queries.getNodePathsToExpand({
      fromNodePath: '/a/',
    });

    expect(result).toEqual(['/a/', '/a/b/']);
  });
});

describe('getResourcePathsAndParentsForAttributions', () => {
  beforeEach(async () => {
    await initializeDb(
      makeFileContent({
        resources: pathsToResources([
          '/src/linked/file.ts',
          '/src/unlinked/other.ts',
        ]),
        externalAttributions: {
          attributions: {
            uuid1: { id: 'uuid1', criticality: 0 },
          },
          resourcesToAttributions: { '/src/linked/file.ts': ['uuid1'] },
          attributionsToResources: { uuid1: ['/src/linked/file.ts'] },
        },
      }),
    );
  });

  it('returns ancestor paths of linked resources', async () => {
    const { result } = await queries.getResourcePathsAndParentsForAttributions({
      attributionUuids: ['uuid1'],
    });

    expect(result).toContain('/');
    expect(result).toContain('/src/');
    expect(result).toContain('/src/linked/');
    expect(result).toContain('/src/linked/file.ts');
    expect(result).not.toContain('/src/unlinked/');
  });

  it('respects limit', async () => {
    const { result } = await queries.getResourcePathsAndParentsForAttributions({
      attributionUuids: ['uuid1'],
      limit: 2,
    });

    expect(result).toHaveLength(2);
  });

  it('prioritizes the given resource and its parents', async () => {
    await initializeDb(
      makeFileContent({
        resources: pathsToResources(['/alpha/file.ts', '/beta/file.ts']),
        externalAttributions: {
          attributions: { uuid1: { id: 'uuid1', criticality: 0 } },
          resourcesToAttributions: {
            '/alpha/file.ts': ['uuid1'],
            '/beta/file.ts': ['uuid1'],
          },
          attributionsToResources: {
            uuid1: ['/alpha/file.ts', '/beta/file.ts'],
          },
        },
      }),
    );

    const { result } = await queries.getResourcePathsAndParentsForAttributions({
      attributionUuids: ['uuid1'],
      limit: 3,
      prioritizedResourcePath: '/beta/file.ts',
    });

    expect(result).toContain('/beta/');
    expect(result).toContain('/beta/file.ts');
  });
});

describe('isResourceLinkedOnAllAttributions', () => {
  beforeEach(async () => {
    await initializeDb(
      makeFileContent({
        resources: pathsToResources(['/linked', '/partial']),
        externalAttributions: {
          attributions: {
            uuid1: { id: 'uuid1', criticality: 0 },
            uuid2: { id: 'uuid2', criticality: 0 },
          },
          resourcesToAttributions: {
            '/linked': ['uuid1', 'uuid2'],
            '/partial': ['uuid1'],
          },
          attributionsToResources: {
            uuid1: ['/linked', '/partial'],
            uuid2: ['/linked'],
          },
        },
      }),
    );
  });

  it('returns true when resource is linked to all given attributions', async () => {
    const { result } = await queries.isResourceLinkedOnAllAttributions({
      resourcePath: '/linked',
      attributionUuids: ['uuid1', 'uuid2'],
    });

    expect(result).toBe(true);
  });

  it('returns false when resource is linked to only some of the given attributions', async () => {
    const { result } = await queries.isResourceLinkedOnAllAttributions({
      resourcePath: '/partial',
      attributionUuids: ['uuid1', 'uuid2'],
    });

    expect(result).toBe(false);
  });
});
