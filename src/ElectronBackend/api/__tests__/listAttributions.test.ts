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

describe('listAttributions', () => {
  it('returns all attributions without filters', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toHaveLength(2);
    expect(result.uuid1).toMatchObject({ relation: 'resource' });
    expect(result.uuid2).toMatchObject({ relation: 'resource' });
  });

  it('classifies attributions by relationship to selected resource', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child']),
      manualAttributions: {
        attributions: {
          'on-parent': { id: 'on-parent', criticality: Criticality.None },
          'on-child': { id: 'on-child', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent': ['on-parent'],
          '/parent/child': ['on-child'],
        },
        attributionsToResources: {
          'on-parent': ['/parent'],
          'on-child': ['/parent/child'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      resourcePathForRelationships: '/parent',
    });

    expect(result['on-parent']).toMatchObject({
      relation: 'resource',
    });
    expect(result['on-child']).toMatchObject({
      relation: 'children',
      count: 1,
    });
  });

  it('sorts attributions alphabetically', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'b',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            packageName: 'a',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid2', 'uuid1']);
  });

  it('sorts attributions by criticality', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.Medium,
            packageName: 'a',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.High,
            packageName: 'b',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      sort: 'criticality',
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid2', 'uuid1']);
  });

  it('sorts attributions by occurrence', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource1', '/resource2']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'a',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            packageName: 'b',
          },
        },
        resourcesToAttributions: {
          '/resource1': ['uuid1', 'uuid2'],
          '/resource2': ['uuid2'],
        },
        attributionsToResources: {
          uuid1: ['/resource1'],
          uuid2: ['/resource1', '/resource2'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      sort: 'occurrence',
      resourcePathForRelationships: '/',
    });

    expect(Object.keys(result)).toEqual(['uuid2', 'uuid1']);
  });

  it('filters by search term', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            packageName: 'search-me',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            packageName: 'other',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      search: 'search-me',
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters by selected licenses', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            licenseName: 'MIT',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            licenseName: 'Apache-2.0',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      valueFilters: { license: 'MIT' },
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with needs-follow-up filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            followUp: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['needsFollowUp'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with pre-selected filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            preSelected: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['preSelected'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with excluded-from-notice filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            excludeFromNotice: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['excludedFromNotice'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with low-confidence filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            attributionConfidence: 59,
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            attributionConfidence: 60,
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['lowConfidence'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with first-party filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            firstParty: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['firstParty'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with third-party filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            firstParty: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['thirdParty'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid2']);
  });

  it('filters with needs-review filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            needsReview: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['needsReview'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with currently-preferred filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            preferred: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['currentlyPreferred'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with previously-preferred filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            wasPreferred: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['previouslyPreferred'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with missing coordinate attributes', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            packageName: 'pkg',
            packageType: 'npm',
            url: 'https://example.com',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      valueFilters: { incompleteCoordinates: 'url' },
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with missing legal attributes', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            copyright: '(c) 2024',
            licenseName: 'MIT',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      valueFilters: { incompleteLegal: 'copyright' },
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('combines license and incomplete coordinate filters', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            licenseName: 'MIT',
          },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            licenseName: 'MIT',
            packageName: 'package',
            packageType: 'npm',
            url: 'https://example.com',
          },
          uuid3: {
            id: 'uuid3',
            criticality: Criticality.None,
            licenseName: 'Apache-2.0',
          },
        },
        resourcesToAttributions: {
          '/resource': ['uuid1', 'uuid2', 'uuid3'],
        },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
          uuid3: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      valueFilters: {
        license: 'MIT',
        incompleteCoordinates: 'any',
      },
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with any missing legal attribute', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: {
            id: 'uuid2',
            criticality: Criticality.None,
            copyright: '(c) 2024',
            licenseName: 'MIT',
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      valueFilters: { incompleteLegal: 'any' },
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('filters with modified-preferred filter', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            criticality: Criticality.None,
            originalAttributionWasPreferred: true,
          },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: ['modifiedPreferred'],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('excludes resolved attributions by default', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      externalAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
      resolvedExternalAttributions: new Set(['uuid2']),
    });

    const { result } = await listAttributions({
      external: true,
      filters: [],
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });

  it('includes resolved attributions when showResolved is true', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      externalAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
        attributionsToResources: {
          uuid1: ['/resource'],
          uuid2: ['/resource'],
        },
      },
      resolvedExternalAttributions: new Set(['uuid2']),
    });

    const { result } = await listAttributions({
      external: true,
      filters: [],
      showResolved: true,
      resourcePathForRelationships: '/resource',
    });

    expect(Object.keys(result)).toHaveLength(2);
  });

  it('excludes unrelated attributions when excludeUnrelated is true', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/target', '/unrelated']),
      manualAttributions: {
        attributions: {
          uuid1: { id: 'uuid1', criticality: Criticality.None },
          uuid2: { id: 'uuid2', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/target': ['uuid1'],
          '/unrelated': ['uuid2'],
        },
        attributionsToResources: {
          uuid1: ['/target'],
          uuid2: ['/unrelated'],
        },
      },
    });

    const { result } = await listAttributions({
      external: false,
      filters: [],
      excludeUnrelated: true,
      resourcePathForRelationships: '/target',
    });

    expect(Object.keys(result)).toEqual(['uuid1']);
  });
});
