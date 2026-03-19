// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import { getPreferredOverOriginIds } from '../../api/getSaveFileArgs';
import { getDb } from '../../db/db';

describe('getPreferredOverOriginIds', () => {
  it('collects origin IDs from external attributions with relevant source', async () => {
    await initializeDbWithTestData({
      resources: { folder: { child: 1 } },
      externalAttributions: {
        attributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        resourcesToAttributions: { '/folder/child': ['externalUuid'] },
        attributionsToResources: { externalUuid: ['/folder/child'] },
      },
      externalAttributionSources: {
        testSource: {
          name: 'Test source',
          priority: 0,
          isRelevantForPreferred: true,
        },
      },
      manualAttributions: {
        attributions: {
          manualUuid: {
            criticality: Criticality.None,
            id: 'manualUuid',
            preferred: true,
          },
        },
        resourcesToAttributions: { '/folder': ['manualUuid'] },
        attributionsToResources: { manualUuid: ['/folder'] },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result).toEqual({ manualUuid: ['originId'] });
  });

  it('returns empty result when source is not relevant for preferred', async () => {
    await initializeDbWithTestData({
      resources: { folder: { child: 1 } },
      externalAttributions: {
        attributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        resourcesToAttributions: { '/folder/child': ['externalUuid'] },
        attributionsToResources: { externalUuid: ['/folder/child'] },
      },
      externalAttributionSources: {
        testSource: {
          name: 'Test source',
          priority: 0,
          isRelevantForPreferred: false,
        },
      },
      manualAttributions: {
        attributions: {
          manualUuid: {
            criticality: Criticality.None,
            id: 'manualUuid',
            preferred: true,
          },
        },
        resourcesToAttributions: { '/folder': ['manualUuid'] },
        attributionsToResources: { manualUuid: ['/folder'] },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result).toEqual({});
  });

  it('collects origin IDs when manual attribution is on the same resource', async () => {
    await initializeDbWithTestData({
      resources: { folder: { child: 1 } },
      externalAttributions: {
        attributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        resourcesToAttributions: { '/folder/child': ['externalUuid'] },
        attributionsToResources: { externalUuid: ['/folder/child'] },
      },
      externalAttributionSources: {
        testSource: {
          name: 'Test source',
          priority: 0,
          isRelevantForPreferred: true,
        },
      },
      manualAttributions: {
        attributions: {
          manualUuid: {
            criticality: Criticality.None,
            id: 'manualUuid',
            preferred: true,
          },
        },
        resourcesToAttributions: { '/folder/child': ['manualUuid'] },
        attributionsToResources: { manualUuid: ['/folder/child'] },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result).toEqual({ manualUuid: ['originId'] });
  });

  it('scopes origin IDs to closest preferred attribution in hierarchy', async () => {
    await initializeDbWithTestData({
      resources: {
        folder: {
          file: 1,
          folder2: {
            child: 1,
          },
        },
      },
      externalAttributions: {
        attributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
          externalUuid1: {
            source: { name: 'testSource1', documentConfidence: 0 },
            originIds: ['originId1'],
            criticality: Criticality.None,
            id: 'externalUuid1',
          },
        },
        resourcesToAttributions: {
          '/folder/folder2/child': ['externalUuid'],
          '/folder/file': ['externalUuid1'],
        },
        attributionsToResources: {
          externalUuid: ['/folder/folder2/child'],
          externalUuid1: ['/folder/file'],
        },
      },
      externalAttributionSources: {
        testSource: {
          name: 'testSource',
          priority: 0,
          isRelevantForPreferred: true,
        },
        testSource1: {
          name: 'testSource1',
          priority: 0,
          isRelevantForPreferred: true,
        },
      },
      manualAttributions: {
        attributions: {
          manualUuid1: {
            criticality: Criticality.None,
            id: 'manualUuid1',
            preferred: true,
          },
          manualUuid2: {
            criticality: Criticality.None,
            id: 'manualUuid2',
            preferred: true,
          },
        },
        resourcesToAttributions: {
          '/folder': ['manualUuid1'],
          '/folder/folder2': ['manualUuid2'],
        },
        attributionsToResources: {
          manualUuid1: ['/folder'],
          manualUuid2: ['/folder/folder2'],
        },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result.manualUuid2).toEqual(['originId']);
    expect(result.manualUuid1).toEqual(['originId1']);
  });

  it('does not include origin IDs from non-preferred manual attributions', async () => {
    await initializeDbWithTestData({
      resources: { folder: { child: 1 } },
      externalAttributions: {
        attributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        resourcesToAttributions: { '/folder/child': ['externalUuid'] },
        attributionsToResources: { externalUuid: ['/folder/child'] },
      },
      externalAttributionSources: {
        testSource: {
          name: 'Test source',
          priority: 0,
          isRelevantForPreferred: true,
        },
      },
      manualAttributions: {
        attributions: {
          manualUuid: {
            criticality: Criticality.None,
            id: 'manualUuid',
          },
        },
        resourcesToAttributions: { '/folder': ['manualUuid'] },
        attributionsToResources: { manualUuid: ['/folder'] },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result).toEqual({});
  });

  it('deduplicates origin IDs across multiple external attributions', async () => {
    await initializeDbWithTestData({
      resources: { folder: { child1: 1, child2: 1 } },
      externalAttributions: {
        attributions: {
          externalUuid1: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['sharedOriginId', 'uniqueId1'],
            criticality: Criticality.None,
            id: 'externalUuid1',
          },
          externalUuid2: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['sharedOriginId', 'uniqueId2'],
            criticality: Criticality.None,
            id: 'externalUuid2',
          },
        },
        resourcesToAttributions: {
          '/folder/child1': ['externalUuid1'],
          '/folder/child2': ['externalUuid2'],
        },
        attributionsToResources: {
          externalUuid1: ['/folder/child1'],
          externalUuid2: ['/folder/child2'],
        },
      },
      externalAttributionSources: {
        testSource: {
          name: 'Test source',
          priority: 0,
          isRelevantForPreferred: true,
        },
      },
      manualAttributions: {
        attributions: {
          manualUuid: {
            criticality: Criticality.None,
            id: 'manualUuid',
            preferred: true,
          },
        },
        resourcesToAttributions: { '/folder': ['manualUuid'] },
        attributionsToResources: { manualUuid: ['/folder'] },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result.manualUuid).toEqual(
      expect.arrayContaining(['sharedOriginId', 'uniqueId1', 'uniqueId2']),
    );
    expect(result.manualUuid).toHaveLength(3);
  });

  it('returns empty result when there are no preferred attributions', async () => {
    await initializeDbWithTestData({
      resources: { folder: { child: 1 } },
      externalAttributions: {
        attributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        resourcesToAttributions: { '/folder/child': ['externalUuid'] },
        attributionsToResources: { externalUuid: ['/folder/child'] },
      },
      externalAttributionSources: {
        testSource: {
          name: 'Test source',
          priority: 0,
          isRelevantForPreferred: true,
        },
      },
    });

    const result = await getPreferredOverOriginIds(getDb());

    expect(result).toEqual({});
  });
});
