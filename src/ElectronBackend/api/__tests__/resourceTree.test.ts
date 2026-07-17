// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Attributions,
  type AttributionsToResources,
  Criticality,
  type Resources,
  type ResourcesToAttributions,
} from '../../../shared/shared-types';
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import {
  getResourceTree,
  getResourceTreeUnreviewedCount,
} from '../resourceTree';

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
      await initializeDbWithTestData({ resources });
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
      await initializeDbWithTestData({
        resources: {
          'z_file.txt': 1,
          'a_file.txt': 1,
          b_folder: {},
          a_folder: {},
        },
      });

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
      await initializeDbWithTestData({
        resources: {
          'a_file.txt': 1,
          'z_file.txt': 1,
          a_folder: {},
          'package.json': {},
        },
        filesWithChildren: new Set(['/package.json']),
      });

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
      await initializeDbWithTestData({
        resources: { src: { 'App.tsx': 1, utils: { 'helper.ts': 1 } } },
      });
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
      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasExternalAttribution).toBe(true);
      expect(fileNode?.hasUnresolvedExternalAttribution).toBe(true);
      expect(fileNode?.hasManualAttribution).toBe(false);
    });

    it('resolved external attribution is not unresolved', async () => {
      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasExternalAttribution).toBe(true);
      expect(fileNode?.hasUnresolvedExternalAttribution).toBe(false);
    });

    it('detects hasManualAttribution', async () => {
      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasManualAttribution).toBe(true);
    });

    it('detects containsExternalAttribution on parent', async () => {
      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsExternalAttribution).toBe(true);
      expect(srcNode?.hasExternalAttribution).toBe(false);
    });

    it('detects containsManualAttribution on parent', async () => {
      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsManualAttribution).toBe(true);
    });

    it('detects hasParentWithManualAttribution', async () => {
      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({
        expandedNodes: ['/', '/src/'],
      });

      const fileNode = result.treeNodes.find((n) => n.id === '/src/file.ts');
      expect(fileNode?.hasParentWithManualAttribution).toBe(true);
    });

    it('breakpoint resets hasParentWithManualAttribution', async () => {
      await initializeDbWithTestData({
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
      });

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

      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const fileNode = result.treeNodes.find((n) => n.id === '/file.ts');
      expect(fileNode?.criticality).toBe(Criticality.High);
    });

    it('returns null criticality when all external attributions are resolved', async () => {
      const uuid = 'ext-uuid';

      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const fileNode = result.treeNodes.find((n) => n.id === '/file.ts');
      expect(fileNode?.criticality).toBeNull();
    });

    it('returns max classification from unresolved external attributions', async () => {
      const uuid1 = 'cls-uuid-1';
      const uuid2 = 'cls-uuid-2';

      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const fileNode = result.treeNodes.find((n) => n.id === '/file.ts');
      expect(fileNode?.classification).toBe(3);
    });
  });

  describe('containsResourcesWithOnlyExternalAttribution', () => {
    it('is true when a descendant has external but no manual attribution', async () => {
      const extUuid = 'ext-uuid';

      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsResourcesWithOnlyExternalAttribution).toBe(true);
    });

    it('is false when all descendants with external also have manual attribution', async () => {
      const extUuid = 'ext-uuid';
      const manualUuid = 'manual-uuid';

      await initializeDbWithTestData({
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
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.containsResourcesWithOnlyExternalAttribution).toBe(false);
    });
  });

  describe('license filtering', () => {
    it('only shows resources linked to matching external attributions once', async () => {
      const firstMitUuid = 'first-mit-uuid';
      const secondMitUuid = 'second-mit-uuid';
      const apacheUuid = 'apache-uuid';

      await initializeDbWithTestData({
        resources: {
          linked: { 'file.ts': 1 },
          unlinked: { 'other.ts': 1 },
        },
        externalAttributions: makeAttributionData(
          {
            [firstMitUuid]: {
              packageName: 'first MIT package',
              criticality: Criticality.None,
              id: firstMitUuid,
              licenseName: 'MIT',
            },
            [secondMitUuid]: {
              packageName: 'second MIT package',
              criticality: Criticality.None,
              id: secondMitUuid,
              licenseName: 'MIT',
            },
            [apacheUuid]: {
              packageName: 'Apache package',
              criticality: Criticality.None,
              id: apacheUuid,
              licenseName: 'Apache-2.0',
            },
          },
          {
            '/linked/file.ts': [firstMitUuid, secondMitUuid],
            '/unlinked/other.ts': [apacheUuid],
          },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        licenseFilter: {
          licenseName: 'MIT',
          external: true,
        },
      });

      expect(result.count).toBe(1);
      const labels = result.treeNodes.map((n) => n.labelText);
      expect(labels).toContain('linked');
      expect(labels).toContain('file.ts');
      expect(labels).not.toContain('unlinked');
      expect(labels).not.toContain('other.ts');
    });

    it('filters resources by manual attribution license when requested', async () => {
      await initializeDbWithTestData({
        resources: {
          attribution: { 'file.ts': 1 },
          signal: { 'file.ts': 1 },
        },
        externalAttributions: makeAttributionData(
          {
            'signal-uuid': {
              packageName: 'signal',
              criticality: Criticality.None,
              id: 'signal-uuid',
              licenseName: 'MIT',
            },
          },
          { '/signal/file.ts': ['signal-uuid'] },
        ),
        manualAttributions: makeAttributionData(
          {
            'attribution-uuid': {
              packageName: 'attribution',
              criticality: Criticality.None,
              id: 'attribution-uuid',
              licenseName: 'MIT',
            },
          },
          { '/attribution/file.ts': ['attribution-uuid'] },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        licenseFilter: {
          licenseName: 'MIT',
          external: false,
        },
      });

      expect(result.treeNodes.map((node) => node.labelText)).toEqual([
        '/',
        'attribution',
        'file.ts',
      ]);
    });
  });

  describe('onlyUnreviewedFiles filtering', () => {
    it('shows files with only external attributions', async () => {
      await initializeDbWithTestData({
        resources: { src: { 'external.ts': 1, 'manual.ts': 1 } },
        externalAttributions: makeAttributionData(
          {
            'external-uuid': {
              packageName: 'external',
              criticality: Criticality.None,
              id: 'external-uuid',
            },
          },
          { '/src/external.ts': ['external-uuid'] },
        ),
        manualAttributions: makeAttributionData(
          {
            'manual-uuid': {
              packageName: 'manual',
              criticality: Criticality.None,
              id: 'manual-uuid',
            },
          },
          { '/src/manual.ts': ['manual-uuid'] },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        onlyUnreviewedFiles: true,
      });

      expect(result.count).toBe(1);
      expect(result.treeNodes.map((node) => node.labelText)).toEqual([
        '/',
        'src',
        'external.ts',
      ]);
    });

    it('shows files with only pre-selected attributions', async () => {
      await initializeDbWithTestData({
        resources: { src: { 'preselected.ts': 1, 'manual.ts': 1 } },
        manualAttributions: makeAttributionData(
          {
            'preselected-uuid': {
              packageName: 'preselected',
              criticality: Criticality.None,
              id: 'preselected-uuid',
              preSelected: true,
            },
            'manual-uuid': {
              packageName: 'manual',
              criticality: Criticality.None,
              id: 'manual-uuid',
            },
          },
          {
            '/src/preselected.ts': ['preselected-uuid'],
            '/src/manual.ts': ['manual-uuid'],
          },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        onlyUnreviewedFiles: true,
      });

      expect(result.count).toBe(1);
      expect(result.treeNodes.map((node) => node.labelText)).toEqual([
        '/',
        'src',
        'preselected.ts',
      ]);
    });

    it('excludes files with non-pre-selected manual attributions', async () => {
      await initializeDbWithTestData({
        resources: { src: { 'manual.ts': 1 } },
        manualAttributions: makeAttributionData(
          {
            'manual-uuid': {
              packageName: 'manual',
              criticality: Criticality.None,
              id: 'manual-uuid',
            },
          },
          { '/src/manual.ts': ['manual-uuid'] },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        onlyUnreviewedFiles: true,
      });

      expect(result.count).toBe(0);
      expect(result.treeNodes).toEqual([]);
    });

    it('excludes files that also have a non-pre-selected manual attribution', async () => {
      await initializeDbWithTestData({
        resources: { src: { 'mixed.ts': 1 } },
        manualAttributions: makeAttributionData(
          {
            'preselected-uuid': {
              packageName: 'preselected',
              criticality: Criticality.None,
              id: 'preselected-uuid',
              preSelected: true,
            },
            'manual-uuid': {
              packageName: 'manual',
              criticality: Criticality.None,
              id: 'manual-uuid',
            },
          },
          { '/src/mixed.ts': ['preselected-uuid', 'manual-uuid'] },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        onlyUnreviewedFiles: true,
      });

      expect(result.count).toBe(0);
      expect(result.treeNodes).toEqual([]);
    });

    it('applies search and unreviewed filtering to the displayed tree', async () => {
      await initializeDbWithTestData({
        resources: {
          src: {
            'matching-external.ts': 1,
            'matching-manual.ts': 1,
            'other-external.ts': 1,
          },
        },
        externalAttributions: makeAttributionData(
          {
            'matching-external-uuid': {
              packageName: 'matching external',
              criticality: Criticality.None,
              id: 'matching-external-uuid',
            },
            'other-external-uuid': {
              packageName: 'other external',
              criticality: Criticality.None,
              id: 'other-external-uuid',
            },
          },
          {
            '/src/matching-external.ts': ['matching-external-uuid'],
            '/src/other-external.ts': ['other-external-uuid'],
          },
        ),
        manualAttributions: makeAttributionData(
          {
            'matching-manual-uuid': {
              packageName: 'matching manual',
              criticality: Criticality.None,
              id: 'matching-manual-uuid',
            },
          },
          { '/src/matching-manual.ts': ['matching-manual-uuid'] },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        onlyUnreviewedFiles: true,
        search: 'matching',
      });

      expect(result.count).toBe(1);
      expect(result.treeNodes.map((node) => node.labelText)).toEqual([
        '/',
        'src',
        'matching-external.ts',
      ]);
    });

    it('filters the displayed tree by signal license', async () => {
      await initializeDbWithTestData({
        resources: {
          src: {
            'preselected-mit.ts': 1,
            'reviewed-mit.ts': 1,
            'external.ts': 1,
          },
        },
        externalAttributions: makeAttributionData(
          {
            'external-uuid': {
              packageName: 'external',
              criticality: Criticality.None,
              id: 'external-uuid',
              licenseName: 'MIT',
            },
          },
          { '/src/external.ts': ['external-uuid'] },
        ),
        manualAttributions: makeAttributionData(
          {
            'preselected-mit-uuid': {
              packageName: 'preselected MIT',
              criticality: Criticality.None,
              id: 'preselected-mit-uuid',
              licenseName: 'MIT',
              preSelected: true,
            },
            'reviewed-mit-uuid': {
              packageName: 'reviewed MIT',
              criticality: Criticality.None,
              id: 'reviewed-mit-uuid',
              licenseName: 'MIT',
            },
          },
          {
            '/src/preselected-mit.ts': ['preselected-mit-uuid'],
            '/src/reviewed-mit.ts': ['reviewed-mit-uuid'],
          },
        ),
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
        licenseFilter: {
          licenseName: 'MIT',
          external: true,
        },
        onlyUnreviewedFiles: true,
      });

      expect(result.count).toBe(1);
      expect(result.treeNodes.map((node) => node.labelText)).toEqual([
        '/',
        'src',
        'external.ts',
      ]);
    });

    it('counts only unreviewed files in the current search context', async () => {
      await initializeDbWithTestData({
        resources: {
          src: { 'external.ts': 1, 'manual.ts': 1, 'preselected.ts': 1 },
        },
        externalAttributions: makeAttributionData(
          {
            'external-uuid': {
              packageName: 'external',
              criticality: Criticality.None,
              id: 'external-uuid',
              licenseName: 'MIT',
            },
          },
          { '/src/external.ts': ['external-uuid'] },
        ),
        manualAttributions: makeAttributionData(
          {
            'preselected-uuid': {
              packageName: 'preselected',
              criticality: Criticality.None,
              id: 'preselected-uuid',
              preSelected: true,
              licenseName: 'Apache-2.0',
            },
            'manual-uuid': {
              packageName: 'manual',
              criticality: Criticality.None,
              id: 'manual-uuid',
            },
          },
          {
            '/src/preselected.ts': ['preselected-uuid'],
            '/src/manual.ts': ['manual-uuid'],
          },
        ),
      });

      await expect(
        getResourceTreeUnreviewedCount({ search: 'src' }),
      ).resolves.toEqual({ result: 2 });

      await expect(
        getResourceTreeUnreviewedCount({ search: 'external' }),
      ).resolves.toEqual({ result: 1 });

      await expect(
        getResourceTreeUnreviewedCount({ search: 'manual' }),
      ).resolves.toEqual({ result: 0 });

      await expect(
        getResourceTreeUnreviewedCount({
          licenseFilter: {
            licenseName: 'MIT',
            external: true,
          },
        }),
      ).resolves.toEqual({ result: 1 });

      await expect(
        getResourceTreeUnreviewedCount({
          licenseFilter: {
            licenseName: 'MIT',
            external: false,
          },
        }),
      ).resolves.toEqual({ result: 0 });
    });
  });

  describe('node properties', () => {
    it('correctly marks files vs directories', async () => {
      await initializeDbWithTestData({
        resources: { src: { 'file.ts': 1 } },
      });

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
      await initializeDbWithTestData({
        resources: { src: { 'file.ts': 1 }, empty: {} },
      });

      const { result } = await getResourceTree({ expandedNodes: ['/'] });

      const srcNode = result.treeNodes.find((n) => n.id === '/src/');
      expect(srcNode?.isExpandable).toBe(true);

      const emptyNode = result.treeNodes.find((n) => n.id === '/empty/');
      expect(emptyNode?.isExpandable).toBe(false);
    });

    it('sets correct levels for nested nodes', async () => {
      await initializeDbWithTestData({
        resources: { a: { b: { 'c.ts': 1 } } },
      });

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

    it('prefers files over directories with same prefixes', async () => {
      await initializeDbWithTestData({
        resources: { a: { b: 1 }, 'a-': {} },
      });

      const { result } = await getResourceTree({
        expandedNodes: 'expandAll',
      });

      const levels = result.treeNodes.map((n) => n.id);
      expect(levels).toEqual(['/', '/a/', '/a/b', '/a-/']);
    });
  });
});
