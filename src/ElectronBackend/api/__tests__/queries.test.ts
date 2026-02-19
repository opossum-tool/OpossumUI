// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality, ParsedFileContent } from '../../../shared/shared-types';
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
describe('getProgressBarData', () => {
  const emptyAttributions = {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
  };

  const baseFileContent: ParsedFileContent = {
    metadata: { projectId: '', fileCreationDate: '' },
    resources: {},
    config: { classifications: {} },
    manualAttributions: emptyAttributions,
    externalAttributions: emptyAttributions,
    frequentLicenses: { nameOrder: [], texts: {} },
    resolvedExternalAttributions: new Set(),
    attributionBreakpoints: new Set(),
    filesWithChildren: new Set(),
    baseUrlsForSources: {},
    externalAttributionSources: {},
  };

  it('returns zero counts when there are no attributions', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/src/file.ts']),
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.fileCount).toBe(1);
    expect(result.filesWithManualAttributionCount).toBe(0);
    expect(result.filesWithOnlyPreSelectedAttributionCount).toBe(0);
    expect(result.filesWithOnlyExternalAttributionCount).toBe(0);
    expect(result.filesWithMediumCriticalExternalAttributionsCount).toBe(0);
    expect(result.filesWithHighlyCriticalExternalAttributionsCount).toBe(0);
    expect(result.resourcesWithNonInheritedExternalAttributionOnly).toEqual([]);
  });

  it('counts only files in fileCount, not directories', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/dir', '/dir/file1.ts', '/dir/file2.ts']),
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.fileCount).toBe(2);
  });

  it('counts files with manual attributions', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/attributed.ts', '/unattributed.ts']),
      manualAttributions: {
        attributions: {
          'manual-1': { id: 'manual-1', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/attributed.ts': ['manual-1'] },
        attributionsToResources: { 'manual-1': ['/attributed.ts'] },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.fileCount).toBe(2);
    expect(result.filesWithManualAttributionCount).toBe(1);
    expect(result.filesWithOnlyPreSelectedAttributionCount).toBe(0);
    expect(result.filesWithOnlyExternalAttributionCount).toBe(0);
  });

  it('counts files with only preselected attributions separately from manual', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/preselected.ts', '/manual.ts']),
      manualAttributions: {
        attributions: {
          'preselected-1': {
            id: 'preselected-1',
            criticality: Criticality.None,
            preSelected: true,
          },
          'manual-1': { id: 'manual-1', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/preselected.ts': ['preselected-1'],
          '/manual.ts': ['manual-1'],
        },
        attributionsToResources: {
          'preselected-1': ['/preselected.ts'],
          'manual-1': ['/manual.ts'],
        },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithOnlyPreSelectedAttributionCount).toBe(1);
    expect(result.filesWithManualAttributionCount).toBe(1);
  });

  it('does not count a file as only-preselected when it also has a real manual attribution', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/mixed.ts']),
      manualAttributions: {
        attributions: {
          'preselected-1': {
            id: 'preselected-1',
            criticality: Criticality.None,
            preSelected: true,
          },
          'manual-1': { id: 'manual-1', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/mixed.ts': ['preselected-1', 'manual-1'],
        },
        attributionsToResources: {
          'preselected-1': ['/mixed.ts'],
          'manual-1': ['/mixed.ts'],
        },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithOnlyPreSelectedAttributionCount).toBe(0);
    expect(result.filesWithManualAttributionCount).toBe(1);
  });

  it('counts files with only external attributions', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/external.ts', '/clean.ts']),
      externalAttributions: {
        attributions: {
          'ext-1': { id: 'ext-1', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/external.ts': ['ext-1'] },
        attributionsToResources: { 'ext-1': ['/external.ts'] },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithOnlyExternalAttributionCount).toBe(1);
    expect(result.filesWithManualAttributionCount).toBe(0);
  });

  it('inherits manual attributions from parent to descendant files', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          'manual-parent': {
            id: 'manual-parent',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: { '/parent': ['manual-parent'] },
        attributionsToResources: { 'manual-parent': ['/parent'] },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithManualAttributionCount).toBe(1);
    expect(result.filesWithOnlyExternalAttributionCount).toBe(0);
  });

  it('attribution breakpoints prevent manual attribution inheritance', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources([
        '/parent/breakpoint/child.ts',
        '/parent/sibling.ts',
      ]),
      manualAttributions: {
        attributions: {
          'manual-parent': {
            id: 'manual-parent',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: { '/parent': ['manual-parent'] },
        attributionsToResources: { 'manual-parent': ['/parent'] },
      },
      attributionBreakpoints: new Set(['/parent/breakpoint/']),
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithManualAttributionCount).toBe(1);
    expect(result.filesWithOnlyExternalAttributionCount).toBe(0);
    expect(result.fileCount).toBe(2);
  });

  it('inherits preselected attributions from parent to descendant files', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          'preselected-parent': {
            id: 'preselected-parent',
            criticality: Criticality.None,
            preSelected: true,
          },
        },
        resourcesToAttributions: { '/parent': ['preselected-parent'] },
        attributionsToResources: { 'preselected-parent': ['/parent'] },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithOnlyPreSelectedAttributionCount).toBe(1);
    expect(result.filesWithManualAttributionCount).toBe(0);
  });

  it('attribution breakpoints prevent preselected attribution inheritance', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/parent/breakpoint/child.ts']),
      manualAttributions: {
        attributions: {
          'preselected-parent': {
            id: 'preselected-parent',
            criticality: Criticality.None,
            preSelected: true,
          },
        },
        resourcesToAttributions: { '/parent': ['preselected-parent'] },
        attributionsToResources: { 'preselected-parent': ['/parent'] },
      },
      attributionBreakpoints: new Set(['/parent/breakpoint/']),
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithOnlyPreSelectedAttributionCount).toBe(0);
    expect(result.filesWithOnlyExternalAttributionCount).toBe(0);
    expect(result.filesWithManualAttributionCount).toBe(0);
  });

  it('counts medium critical external attributions', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/medium.ts', '/high.ts', '/none.ts']),
      externalAttributions: {
        attributions: {
          'ext-medium': {
            id: 'ext-medium',
            criticality: Criticality.Medium,
          },
          'ext-high': { id: 'ext-high', criticality: Criticality.High },
          'ext-none': { id: 'ext-none', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/medium.ts': ['ext-medium'],
          '/high.ts': ['ext-high'],
          '/none.ts': ['ext-none'],
        },
        attributionsToResources: {
          'ext-medium': ['/medium.ts'],
          'ext-high': ['/high.ts'],
          'ext-none': ['/none.ts'],
        },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithMediumCriticalExternalAttributionsCount).toBe(1);
    expect(result.filesWithHighlyCriticalExternalAttributionsCount).toBe(1);
    expect(result.filesWithOnlyExternalAttributionCount).toBe(3);
  });

  it('populates path lists for resources with non-inherited critical external attributions', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/medium.ts', '/high.ts']),
      externalAttributions: {
        attributions: {
          'ext-medium': {
            id: 'ext-medium',
            criticality: Criticality.Medium,
          },
          'ext-high': { id: 'ext-high', criticality: Criticality.High },
        },
        resourcesToAttributions: {
          '/medium.ts': ['ext-medium'],
          '/high.ts': ['ext-high'],
        },
        attributionsToResources: {
          'ext-medium': ['/medium.ts'],
          'ext-high': ['/high.ts'],
        },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.resourcesWithMediumCriticalExternalAttributions).toEqual([
      '/medium.ts',
    ]);
    expect(result.resourcesWithHighlyCriticalExternalAttributions).toEqual([
      '/high.ts',
    ]);
    expect(result.resourcesWithNonInheritedExternalAttributionOnly).toContain(
      '/medium.ts',
    );
    expect(result.resourcesWithNonInheritedExternalAttributionOnly).toContain(
      '/high.ts',
    );
  });

  it('does not include resources with manual attributions in non-inherited external attribution lists', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/file.ts']),
      externalAttributions: {
        attributions: {
          'ext-1': { id: 'ext-1', criticality: Criticality.High },
        },
        resourcesToAttributions: { '/file.ts': ['ext-1'] },
        attributionsToResources: { 'ext-1': ['/file.ts'] },
      },
      manualAttributions: {
        attributions: {
          'manual-1': { id: 'manual-1', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/file.ts': ['manual-1'] },
        attributionsToResources: { 'manual-1': ['/file.ts'] },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithHighlyCriticalExternalAttributionsCount).toBe(0);
    expect(result.resourcesWithHighlyCriticalExternalAttributions).toEqual([]);
    expect(result.resourcesWithNonInheritedExternalAttributionOnly).toEqual([]);
    expect(result.filesWithManualAttributionCount).toBe(1);
  });

  it('excludes resolved external attributions from all counts', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/file.ts']),
      externalAttributions: {
        attributions: {
          'ext-resolved': {
            id: 'ext-resolved',
            criticality: Criticality.High,
          },
        },
        resourcesToAttributions: { '/file.ts': ['ext-resolved'] },
        attributionsToResources: { 'ext-resolved': ['/file.ts'] },
      },
      resolvedExternalAttributions: new Set(['ext-resolved']),
    });

    const { result } = await queries.getProgressBarData({
      classifications: {},
    });

    expect(result.filesWithOnlyExternalAttributionCount).toBe(0);
    expect(result.filesWithHighlyCriticalExternalAttributionsCount).toBe(0);
    expect(result.resourcesWithNonInheritedExternalAttributionOnly).toEqual([]);
  });

  it('returns classification statistics with corresponding file paths', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/classified.ts', '/unclassified.ts']),
      externalAttributions: {
        attributions: {
          'ext-copyleft': {
            id: 'ext-copyleft',
            criticality: Criticality.None,
            classification: 2,
          },
          'ext-no-class': {
            id: 'ext-no-class',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: {
          '/classified.ts': ['ext-copyleft'],
          '/unclassified.ts': ['ext-no-class'],
        },
        attributionsToResources: {
          'ext-copyleft': ['/classified.ts'],
          'ext-no-class': ['/unclassified.ts'],
        },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {
        2: { description: 'Copyleft', color: '#ff0000' },
      },
    });

    expect(result.classificationStatistics[2]).toEqual({
      description: 'Copyleft',
      color: '#ff0000',
      correspondingFiles: ['/classified.ts'],
    });
  });

  it('returns empty corresponding files for classifications with no matches', async () => {
    await initializeDb({ ...baseFileContent });

    const { result } = await queries.getProgressBarData({
      classifications: {
        1: { description: 'Permissive', color: '#00ff00' },
      },
    });

    expect(result.classificationStatistics[1]?.correspondingFiles).toEqual([]);
  });

  it('does not include files with manual attributions in classification statistics', async () => {
    await initializeDb({
      ...baseFileContent,
      resources: pathsToResources(['/file.ts']),
      externalAttributions: {
        attributions: {
          'ext-1': {
            id: 'ext-1',
            criticality: Criticality.None,
            classification: 1,
          },
        },
        resourcesToAttributions: { '/file.ts': ['ext-1'] },
        attributionsToResources: { 'ext-1': ['/file.ts'] },
      },
      manualAttributions: {
        attributions: {
          'manual-1': { id: 'manual-1', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/file.ts': ['manual-1'] },
        attributionsToResources: { 'manual-1': ['/file.ts'] },
      },
    });

    const { result } = await queries.getProgressBarData({
      classifications: {
        1: { description: 'Permissive', color: '#00ff00' },
      },
    });

    expect(result.classificationStatistics[1].correspondingFiles).toEqual([]);
  });
});
