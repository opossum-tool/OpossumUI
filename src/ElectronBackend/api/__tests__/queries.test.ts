// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ParsedFileContent } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { pathsToResources } from '../../../testing/global-test-helpers';
import { initializeDb } from '../../db/initializeDb';
import { queries } from '../queries';

const TEST_FILE_CONTENT: ParsedFileContent = {
  metadata: { projectId: '', fileCreationDate: '' },
  resources: { src: { 'App.tsx': 1, utils: { 'helper.ts': 1 } } },
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
};

describe('searchResources', () => {
  beforeEach(async () => {
    await initializeDb(TEST_FILE_CONTENT);
  });

  it('finds resources matching search string case-insensitively', async () => {
    const results = await queries.searchResources({ searchString: 'APP' });

    expect(results.result).toEqual(['/src/App.tsx']);
  });

  it('appends trailing slash to directories', async () => {
    const results = await queries.searchResources({ searchString: 'src' });

    expect(results.result).toContain('/src/');
  });
});

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
