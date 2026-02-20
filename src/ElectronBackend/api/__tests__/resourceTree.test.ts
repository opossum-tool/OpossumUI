// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  AttributionsToResources,
  Criticality,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { initializeDb } from '../../db/initializeDb';
import { getResourceTree } from '../resourceTree';

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

function makeAttributionData(
  attributions: Attributions,
  resourcesToAttributions: ResourcesToAttributions,
) {
  const attributionsToResources: AttributionsToResources = {};
  for (const [resource, uuids] of Object.entries(resourcesToAttributions)) {
    for (const uuid of uuids) {
      if (!attributionsToResources[uuid]) {
        attributionsToResources[uuid] = [];
      }
      attributionsToResources[uuid].push(resource);
    }
  }
  return { attributions, resourcesToAttributions, attributionsToResources };
}

describe('getResourceTree', () => {
  describe('basic tree structure', () => {
    const resources: Resources = {
      src: { 'App.tsx': 1, utils: { 'helper.ts': 1 } },
      docs: { 'readme.md': 1 },
    };

    beforeEach(async () => {
      await initializeDb(makeFileContent({ resources }));
    });

    it('returns only root when nothing is expanded', async () => {
      const { result } = await getResourceTree({ expandedNodes: [] });

      expect(result.treeNodes).toHaveLength(1);
      expect(result.treeNodes[0]).toMatchObject({
        id: '/',
        labelText: '/',
        level: 0,
        isExpandable: true,
        isExpanded: false,
      });
    });

    it('returns root and its children when root is expanded', async () => {
      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toEqual(['/', 'docs', 'src']);
    });

    it('returns nested children when all ancestors are expanded', async () => {
      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toEqual(['/', 'docs', 'src', 'utils', 'App.tsx']);
    });

    it('returns full tree when expandAll is used', async () => {
      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
      });

      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toEqual([
        '/',
        'docs',
        'readme.md',
        'src',
        'utils',
        'helper.ts',
        'App.tsx',
      ]);
    });

    it('reports correct count of total resources', async () => {
      const { result } = await getResourceTree({ expandedNodes: [] });

      // root, src, App.tsx, utils, helper.ts, docs, readme.md = 7
      expect(result.count).toBe(7);
    });
  });

  describe('sorting', () => {
    it('sorts folders before files, then alphabetically', async () => {
      await initializeDb(
        makeFileContent({
          resources: {
            'z_file.txt': 1,
            'a_file.txt': 1,
            b_folder: {},
            a_folder: {},
          },
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const labels = result.treeNodes
        .filter((n) => n.level === 1)
        .map((n) => n.labelText);
      expect(labels).toEqual([
        'a_folder',
        'b_folder',
        'a_file.txt',
        'z_file.txt',
      ]);
    });

    it('sorts files_with_children with files', async () => {
      await initializeDb(
        makeFileContent({
          resources: {
            'a_file.txt': 1,
            'z_file.txt': 1,
            a_folder: {},
            'package.json': {},
          },
          filesWithChildren: new Set(['/package.json']),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const labels = result.treeNodes
        .filter((n) => n.level === 1)
        .map((n) => n.labelText);
      expect(labels).toEqual([
        'a_folder',
        'a_file.txt',
        'package.json',
        'z_file.txt',
      ]);
    });
  });

  describe('search filtering', () => {
    beforeEach(async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'App.tsx': 1, utils: { 'helper.ts': 1 } } },
        }),
      );
    });

    it('filters tree to show only nodes with matching descendants', async () => {
      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        search: 'App',
      });

      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toContain('/');
      expect(labels).toContain('src');
      expect(labels).toContain('App.tsx');
      expect(labels).not.toContain('utils');
      expect(labels).not.toContain('helper.ts');
    });

    it('search is case-insensitive', async () => {
      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        search: 'app',
      });

      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toContain('App.tsx');
    });

    it('reports filtered count', async () => {
      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        search: 'App',
      });

      expect(result.count).toBe(1); // only /src/App.tsx matches the search
    });
  });

  describe('attribution flags', () => {
    const externalUuid = 'ext-uuid';
    const manualUuid = 'manual-uuid';

    it('detects hasExternalAttribution and hasUnresolvedExternalAttribution', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          externalAttributions: makeAttributionData(
            {
              [externalUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: externalUuid,
              },
            },
            { '/src/file.ts': [externalUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasExternalAttribution).toBe(true);
      expect(fileNode?.hasUnresolvedExternalAttribution).toBe(true);
      expect(fileNode?.hasManualAttribution).toBe(false);
    });

    it('resolved external attribution is not unresolved', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          externalAttributions: makeAttributionData(
            {
              [externalUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: externalUuid,
              },
            },
            { '/src/file.ts': [externalUuid] },
          ),
          resolvedExternalAttributions: new Set([externalUuid]),
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasExternalAttribution).toBe(true);
      expect(fileNode?.hasUnresolvedExternalAttribution).toBe(false);
    });

    it('detects hasManualAttribution', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          manualAttributions: makeAttributionData(
            {
              [manualUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: manualUuid,
              },
            },
            { '/src/file.ts': [manualUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasManualAttribution).toBe(true);
    });

    it('detects containsExternalAttribution on parent', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          externalAttributions: makeAttributionData(
            {
              [externalUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: externalUuid,
              },
            },
            { '/src/file.ts': [externalUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsExternalAttribution).toBe(true);
      expect(srcNode?.hasExternalAttribution).toBe(false);
    });

    it('detects containsManualAttribution on parent', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          manualAttributions: makeAttributionData(
            {
              [manualUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: manualUuid,
              },
            },
            { '/src/file.ts': [manualUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsManualAttribution).toBe(true);
    });

    it('detects hasParentWithManualAttribution', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          manualAttributions: makeAttributionData(
            {
              [manualUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: manualUuid,
              },
            },
            { '/src/': [manualUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasParentWithManualAttribution).toBe(true);
    });

    it('breakpoint resets hasParentWithManualAttribution', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { inner: { 'file.ts': 1 } } },
          manualAttributions: makeAttributionData(
            {
              [manualUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: manualUuid,
              },
            },
            { '/src/': [manualUuid] },
          ),
          attributionBreakpoints: new Set(['/src/inner']),
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/', '/src/inner/'],
      });

      const innerNode = result.treeNodes.find((n) => n.id === '/src/inner/');
      expect(innerNode?.isAttributionBreakpoint).toBe(true);
      expect(innerNode?.hasParentWithManualAttribution).toBe(false);

      const fileNode = result.treeNodes.find(
        (n) => n.id === '/src/inner/file.ts',
      );
      expect(fileNode?.hasParentWithManualAttribution).toBe(false);
    });
  });

  describe('criticality and classification', () => {
    it('returns max criticality from unresolved external attributions', async () => {
      const highUuid = 'high-uuid';
      const mediumUuid = 'medium-uuid';

      await initializeDb(
        makeFileContent({
          resources: { 'file.ts': 1 },
          externalAttributions: makeAttributionData(
            {
              [highUuid]: {
                packageName: 'high',
                criticality: Criticality.High,
                id: highUuid,
              },
              [mediumUuid]: {
                packageName: 'medium',
                criticality: Criticality.Medium,
                id: mediumUuid,
              },
            },
            { '/file.ts': [highUuid, mediumUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const fileNode = result.treeNodes.find((n) => n.id === '/file.ts');
      expect(fileNode?.criticality).toBe(Criticality.High);
    });

    it('returns null criticality when all external attributions are resolved', async () => {
      const uuid = 'ext-uuid';

      await initializeDb(
        makeFileContent({
          resources: { 'file.ts': 1 },
          externalAttributions: makeAttributionData(
            {
              [uuid]: {
                packageName: 'pkg',
                criticality: Criticality.High,
                id: uuid,
              },
            },
            { '/file.ts': [uuid] },
          ),
          resolvedExternalAttributions: new Set([uuid]),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const fileNode = result.treeNodes.find((n) => n.id === '/file.ts');
      expect(fileNode?.criticality).toBeNull();
    });

    it('returns max classification from unresolved external attributions', async () => {
      const uuid1 = 'cls-uuid-1';
      const uuid2 = 'cls-uuid-2';

      await initializeDb(
        makeFileContent({
          resources: { 'file.ts': 1 },
          externalAttributions: makeAttributionData(
            {
              [uuid1]: {
                packageName: 'pkg1',
                criticality: Criticality.None,
                classification: 1,
                id: uuid1,
              },
              [uuid2]: {
                packageName: 'pkg2',
                criticality: Criticality.None,
                classification: 3,
                id: uuid2,
              },
            },
            { '/file.ts': [uuid1, uuid2] },
          ),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const fileNode = result.treeNodes.find((n) => n.id === '/file.ts');
      expect(fileNode?.classification).toBe(3);
    });
  });

  describe('containsResourcesWithOnlyExternalAttribution', () => {
    it('is true when a descendant has external but no manual attribution', async () => {
      const extUuid = 'ext-uuid';

      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          externalAttributions: makeAttributionData(
            {
              [extUuid]: {
                packageName: 'pkg',
                criticality: Criticality.None,
                id: extUuid,
              },
            },
            { '/src/file.ts': [extUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsResourcesWithOnlyExternalAttribution).toBe(true);
    });

    it('is false when all descendants with external also have manual attribution', async () => {
      const extUuid = 'ext-uuid';
      const manualUuid = 'manual-uuid';

      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
          externalAttributions: makeAttributionData(
            {
              [extUuid]: {
                packageName: 'ext-pkg',
                criticality: Criticality.None,
                id: extUuid,
              },
            },
            { '/src/file.ts': [extUuid] },
          ),
          manualAttributions: makeAttributionData(
            {
              [manualUuid]: {
                packageName: 'manual-pkg',
                criticality: Criticality.None,
                id: manualUuid,
              },
            },
            { '/src/file.ts': [manualUuid] },
          ),
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsResourcesWithOnlyExternalAttribution).toBe(false);
    });
  });

  describe('onAttributionUuids filtering', () => {
    it('only shows resources linked to the given attribution', async () => {
      const uuid = 'target-uuid';
      const otherUuid = 'other-uuid';

      await initializeDb(
        makeFileContent({
          resources: {
            linked: { 'file.ts': 1 },
            unlinked: { 'other.ts': 1 },
          },
          externalAttributions: makeAttributionData(
            {
              [uuid]: {
                packageName: 'target',
                criticality: Criticality.None,
                id: uuid,
              },
              [otherUuid]: {
                packageName: 'other',
                criticality: Criticality.None,
                id: otherUuid,
              },
            },
            {
              '/linked/file.ts': [uuid],
              '/unlinked/other.ts': [otherUuid],
            },
          ),
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        onAttributionUuids: [uuid],
      });

      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toContain('linked');
      expect(labels).toContain('file.ts');
      expect(labels).not.toContain('unlinked');
      expect(labels).not.toContain('other.ts');
    });
  });

  describe('node properties', () => {
    it('correctly marks files vs directories', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 } },
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.isFile).toBe(false);
      expect(srcNode?.canHaveChildren).toBe(true);

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.isFile).toBe(true);
      expect(fileNode?.canHaveChildren).toBe(false);
    });

    it('marks nodes as expandable when they have children', async () => {
      await initializeDb(
        makeFileContent({
          resources: { src: { 'file.ts': 1 }, empty: {} },
        }),
      );

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.isExpandable).toBe(true);

      const emptyNode = result.treeNodes.find((n) => n.id === '/empty/');
      expect(emptyNode?.isExpandable).toBe(false);
    });

    it('sets correct levels for nested nodes', async () => {
      await initializeDb(
        makeFileContent({
          resources: { a: { b: { 'c.ts': 1 } } },
        }),
      );

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
      });

      const levels = result.treeNodes.map((n) => [n.labelText, n.level]);
      expect(levels).toEqual([
        ['/', 0],
        ['a', 1],
        ['b', 2],
        ['c.ts', 3],
      ]);
    });
  });
});
