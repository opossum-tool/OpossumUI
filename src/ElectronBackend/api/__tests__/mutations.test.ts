// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AiAttributions,
  type Attributions,
  Criticality,
  type PackageInfo,
} from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';
import { AttributionResourceAccess } from '../../types/types';
import { listAttributionsPage } from '../attributions/listAttributionsPage';
import { getSaveFileArgs } from '../getSaveFileArgs';
import {
  decorateMutationRegistry,
  type MutationResponse,
  mutations,
} from '../mutations';
import { queries } from '../queries';

function packageInfo(
  id: string,
  packageName: string,
  aiAttributions?: AiAttributions,
): PackageInfo {
  return {
    id,
    packageName,
    criticality: Criticality.None,
    ...(aiAttributions === undefined ? {} : { aiAttributions }),
  };
}

async function resourceAccessOf(attributionUuid: string) {
  return (
    await getDb()
      .selectFrom('attribution')
      .select('resource_access')
      .where('uuid', '=', attributionUuid)
      .executeTakeFirstOrThrow()
  ).resource_access;
}

async function attributionUuidsOn(path: string) {
  return (
    await getDb()
      .selectFrom('resource_to_attribution as rta')
      .innerJoin('resource', 'resource.id', 'rta.resource_id')
      .select('attribution_uuid')
      .where('resource.path', '=', path)
      .execute()
  ).map((link) => link.attribution_uuid);
}

const metadataMatchingCases: Array<{
  name: string;
  sourceMetadata?: Record<string, unknown>;
  candidateMetadata?: Record<string, unknown>;
  expectedToMatch: boolean;
}> = [
  {
    name: 'different unknown properties',
    sourceMetadata: { known: true, sourceOnly: 1 },
    candidateMetadata: { known: true, candidateOnly: 1 },
    expectedToMatch: false,
  },
  {
    name: 'different nested values',
    sourceMetadata: { nested: { value: 1 } },
    candidateMetadata: { nested: { value: 2 } },
    expectedToMatch: false,
  },
  {
    name: 'different array contents',
    sourceMetadata: { values: [1, 2] },
    candidateMetadata: { values: [1, 3] },
    expectedToMatch: false,
  },
  {
    name: 'different array order',
    sourceMetadata: { values: [1, 2] },
    candidateMetadata: { values: [2, 1] },
    expectedToMatch: false,
  },
  {
    name: 'different array value types',
    sourceMetadata: { values: [1] },
    candidateMetadata: { values: ['1'] },
    expectedToMatch: false,
  },
  {
    name: 'missing property',
    sourceMetadata: { present: true },
    candidateMetadata: {},
    expectedToMatch: false,
  },
  {
    name: 'AI source and ordinary target',
    sourceMetadata: {},
    expectedToMatch: false,
  },
  {
    name: 'ordinary source and AI target',
    candidateMetadata: {},
    expectedToMatch: false,
  },
  {
    name: 'two empty metadata objects',
    sourceMetadata: {},
    candidateMetadata: {},
    expectedToMatch: true,
  },
  {
    name: 'two ordinary attributions without metadata',
    expectedToMatch: true,
  },
  {
    name: 'omitted humanModified and false',
    sourceMetadata: { generated: true },
    candidateMetadata: { generated: true, humanModified: false },
    expectedToMatch: true,
  },
  {
    name: 'false and true humanModified values',
    sourceMetadata: { humanModified: false },
    candidateMetadata: { humanModified: true },
    expectedToMatch: true,
  },
];

describe('attribution resource access', () => {
  it('rejects resolving an external attribution only on readonly resources', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/readonly/file.ts']),
      externalAttributions: {
        attributions: {
          signal: { id: 'signal', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/readonly/file.ts': ['signal'] },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });

    await expect(
      mutations.resolveAttributions({
        selection: { mode: 'explicit', attributionUuids: ['signal'] },
      }),
    ).rejects.toThrow(/readonly/i);
  });

  it('awaits the resolved attribution cache after resolving', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      externalAttributions: {
        attributions: {
          signal: { id: 'signal', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/writable/file.ts': ['signal'] },
        attributionsToResources: {},
      },
    });

    const response = await mutations.resolveAttributions({
      selection: { mode: 'explicit', attributionUuids: ['signal'] },
    });

    expect(response.invalidates).toContainEqual({
      queryName: 'resolvedAttributionUuids',
      awaitRefetch: true,
    });
    expect(response.invalidates).toContainEqual({
      queryName: 'getLinkedResourceTree',
    });
  });

  async function initializeReadonlyStructuralAncestor() {
    await initializeDbWithTestData({
      resources: pathsToResources(['/editable/file.ts']),
      manualAttributions: {
        attributions: {
          shared: { id: 'shared', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/': ['shared'],
          '/editable/file.ts': ['shared'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/editable', readonly: false },
      ],
    });
  }

  it('rejects creating an attribution on a readonly structural ancestor', async () => {
    await initializeReadonlyStructuralAncestor();

    await expect(
      mutations.createOrMatchAttributions({
        resourcePath: '/',
        attributions: {
          new: { id: 'new', criticality: Criticality.None },
        },
      }),
    ).rejects.toThrow(/readonly/i);
    expect(
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('uuid', '=', 'new')
        .execute(),
    ).toEqual([]);
  });

  it('rejects modifying an attribution only on a readonly structural ancestor', async () => {
    await initializeReadonlyStructuralAncestor();

    await expect(
      mutations.modifyOrMatchOnlyOnOneResource({
        resourcePath: '/',
        attributions: {
          shared: {
            id: 'shared',
            criticality: Criticality.None,
            packageName: 'updated',
          },
        },
      }),
    ).rejects.toThrow(/readonly/i);
    expect(
      await getDb()
        .selectFrom('attribution')
        .select('package_name')
        .where('uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).toEqual({ package_name: null });
  });

  it('rejects unlinking an attribution from a readonly structural ancestor', async () => {
    await initializeReadonlyStructuralAncestor();

    await expect(
      mutations.unlinkResourceFromAttributions({
        resourcePath: '/',
        selection: { mode: 'explicit', attributionUuids: ['shared'] },
      }),
    ).rejects.toThrow(/readonly/i);
    expect(
      await getDb()
        .selectFrom('resource_to_attribution as rta')
        .innerJoin('resource', 'resource.id', 'rta.resource_id')
        .select('attribution_uuid')
        .where('resource.path', '=', '')
        .execute(),
    ).toEqual([{ attribution_uuid: 'shared' }]);
  });

  it('makes a newly linked attribution visible without reloading the file', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
    });

    const response = await mutations.createOrMatchAttributions({
      resourcePath: '/writable/file.ts',
      attributions: {
        new: { id: 'new', criticality: Criticality.None },
      },
    });
    const { result: page } = await listAttributionsPage({
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '',
      showResolved: true,
      excludeUnrelated: false,
      scope: { mode: 'all' },
      sort: 'alphabetically',
      includeReadonly: true,
      offset: 0,
      limit: 200,
    });
    const attributions = page.attributions;

    const createdAttributionUuid = (
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('package_name', 'is', null)
        .executeTakeFirstOrThrow()
    ).uuid;
    expect(response.invalidates).toContainEqual({
      queryName: 'getResourcePathsAndParentsForAttributions',
    });
    expect(Object.keys(attributions)).toContain(createdAttributionUuid);
    expect(await resourceAccessOf(createdAttributionUuid)).toBe(
      AttributionResourceAccess.Writable,
    );
    expect(
      await getDb()
        .selectFrom('attribution_ai')
        .selectAll()
        .where('attribution_uuid', '=', createdAttributionUuid)
        .execute(),
    ).toEqual([]);
  });

  it('omits raw AI metadata from ordinary attribution query results', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/a']),
      manualAttributions: {
        attributions: {
          ai: {
            id: 'ai',
            criticality: Criticality.None,
            packageName: 'with metadata',
            ...{ aiAttributions: { opaque: true } },
          },
        },
        resourcesToAttributions: { '/a': ['ai'] },
        attributionsToResources: {},
      },
    });

    const { result } = await listAttributionsPage({
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '',
      showResolved: true,
      excludeUnrelated: false,
      scope: { mode: 'all' },
      sort: 'alphabetically',
      includeReadonly: true,
      offset: 0,
      limit: 200,
    });

    expect(result.attributions.ai).not.toHaveProperty('aiAttributions');
  });

  it('exposes the AI-generated flag of the attribution_ai table via getAttributionData', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/a']),
      manualAttributions: {
        attributions: {
          humanModified: packageInfo('humanModified', 'flagged', {
            humanModified: true,
          }),
          notHumanModified: packageInfo('notHumanModified', 'unflagged', {
            humanModified: false,
          }),
          flagAbsent: packageInfo('flagAbsent', 'absent flag', {}),
          deferred: packageInfo('deferred', 'deferred fields', {
            deferred_fields: { copyright: true },
          }),
          deferredList: packageInfo('deferredList', 'deferred list', {
            deferred_fields: ['copyright', 'licenseText'],
          }),
          deferredEmptyList: packageInfo(
            'deferredEmptyList',
            'deferred empty list',
            {
              deferred_fields: [],
            },
          ),
          deferredAndModified: packageInfo(
            'deferredAndModified',
            'deferred and modified',
            {
              humanModified: true,
              deferred_fields: {},
            },
          ),
          notAi: packageInfo('notAi', 'not ai'),
        },
        resourcesToAttributions: {
          '/a': [
            'humanModified',
            'notHumanModified',
            'flagAbsent',
            'deferred',
            'deferredList',
            'deferredEmptyList',
            'deferredAndModified',
            'notAi',
          ],
        },
        attributionsToResources: {},
      },
    });

    const humanModifiedResult = await queries.getAttributionData({
      attributionUuid: 'humanModified',
    });
    expect(humanModifiedResult.result.packageInfo.aiAttributions).toEqual({
      humanModified: true,
    });

    const notHumanModifiedResult = await queries.getAttributionData({
      attributionUuid: 'notHumanModified',
    });
    expect(notHumanModifiedResult.result.packageInfo.aiAttributions).toEqual({
      humanModified: false,
    });

    const flagAbsentResult = await queries.getAttributionData({
      attributionUuid: 'flagAbsent',
    });
    expect(flagAbsentResult.result.packageInfo.aiAttributions).toEqual({});

    const deferredResult = await queries.getAttributionData({
      attributionUuid: 'deferred',
    });
    expect(deferredResult.result.packageInfo.aiAttributions).toEqual({
      deferred: true,
    });

    const deferredListResult = await queries.getAttributionData({
      attributionUuid: 'deferredList',
    });
    expect(deferredListResult.result.packageInfo.aiAttributions).toEqual({
      deferred: true,
    });

    const deferredEmptyListResult = await queries.getAttributionData({
      attributionUuid: 'deferredEmptyList',
    });
    expect(deferredEmptyListResult.result.packageInfo.aiAttributions).toEqual({
      deferred: true,
    });

    const deferredAndModifiedResult = await queries.getAttributionData({
      attributionUuid: 'deferredAndModified',
    });
    expect(deferredAndModifiedResult.result.packageInfo.aiAttributions).toEqual(
      {
        humanModified: true,
        deferred: true,
      },
    );

    const notAiResult = await queries.getAttributionData({
      attributionUuid: 'notAi',
    });
    expect(notAiResult.result.packageInfo).not.toHaveProperty('aiAttributions');
  });

  it('preserves stored AI metadata when updating a queried attribution', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/a']),
      manualAttributions: {
        attributions: {
          ai: {
            id: 'ai',
            criticality: Criticality.None,
            packageName: 'before',
            ...{ aiAttributions: { opaque: { nested: true } } },
          },
        },
        resourcesToAttributions: { '/a': ['ai'] },
        attributionsToResources: {},
      },
    });

    const { result } = await queries.getAttributionData({
      attributionUuid: 'ai',
    });
    expect(result.packageInfo.aiAttributions).toStrictEqual({});

    await mutations.updateOrMatchAttributions({
      attributions: {
        ai: { ...result.packageInfo, packageName: 'after' },
      },
    });

    await expect(
      getDb()
        .selectFrom('attribution')
        .select('package_name')
        .where('uuid', '=', 'ai')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ package_name: 'after' });
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select(['additional_data', 'human_modified'])
        .where('attribution_uuid', '=', 'ai')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({
      additional_data: '{"opaque":{"nested":true}}',
      human_modified: 1,
    });
  });

  it('returns only the focused remapping for a query-wide link', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      externalAttributions: {
        attributions: {
          focused: { id: 'focused', criticality: Criticality.None },
          other: { id: 'other', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/writable/file.ts': ['focused', 'other'],
        },
        attributionsToResources: {},
      },
    });

    const response = await mutations.createOrMatchAttributions({
      resourcePath: '/writable/file.ts',
      selection: {
        mode: 'allMatching',
        query: {
          external: true,
          filters: [],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/writable/file.ts',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: [],
      },
      focusedAttributionUuid: 'focused',
    });

    const { focusedAttributionOutcome } = response.result;
    expect(focusedAttributionOutcome).toMatchObject({
      status: 'remapped',
      attributionUuid: 'focused',
    });
    if (focusedAttributionOutcome.status !== 'remapped') {
      throw new Error('Expected focused attribution to be remapped');
    }
    expect(focusedAttributionOutcome.newAttributionUuid).not.toBe('focused');
  });

  it('hides an attribution after its last writable link is removed', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/readonly/file.ts', '/writable/file.ts']),
      manualAttributions: {
        attributions: {
          shared: { id: 'shared', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/readonly/file.ts': ['shared'],
          '/writable/file.ts': ['shared'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });
    await getDb()
      .insertInto('attribution_ai')
      .values({
        attribution_uuid: 'shared',
        additional_data: '{"source":"ai"}',
      })
      .execute();

    await mutations.unlinkResourceFromAttributions({
      resourcePath: '/writable/file.ts',
      selection: { mode: 'explicit', attributionUuids: ['shared'] },
    });

    const { result: page } = await listAttributionsPage({
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '',
      showResolved: true,
      excludeUnrelated: false,
      scope: { mode: 'all' },
      sort: 'alphabetically',
      includeReadonly: true,
      offset: 0,
      limit: 200,
    });
    const attributions = page.attributions;

    expect(attributions).toEqual({});
    expect(await resourceAccessOf('shared')).toBe(
      AttributionResourceAccess.Readonly,
    );
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select('human_modified')
        .where('attribution_uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ human_modified: null });
  });

  it('does not reuse AI metadata when matching an ordinary external signal', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/existing', '/external']),
      externalAttributions: {
        attributions: {
          source: {
            id: 'source',
            criticality: Criticality.None,
            packageName: 'source',
          },
        },
        resourcesToAttributions: { '/external': ['source'] },
        attributionsToResources: {},
      },
      manualAttributions: {
        attributions: {
          existing: {
            id: 'existing',
            criticality: Criticality.None,
            packageName: 'matching target',
            ...{ aiAttributions: { origin: 'target' } },
          },
        },
        resourcesToAttributions: { '/existing': ['existing'] },
        attributionsToResources: {},
      },
    });
    await mutations.createOrMatchAttributions({
      resourcePath: '/external',
      attributions: {
        copied: {
          id: 'source',
          criticality: Criticality.None,
          packageName: 'new copy',
        },
        matchingTarget: {
          id: 'source',
          criticality: Criticality.None,
          packageName: 'matching target',
        },
      },
    });

    const aiRows = await getDb()
      .selectFrom('attribution_ai')
      .select(['attribution_uuid', 'additional_data'])
      .execute();
    expect(aiRows).toEqual([
      {
        attribution_uuid: 'existing',
        additional_data: '{"origin":"target"}',
      },
    ]);
    const { result: saveFileArgs } = await getSaveFileArgs();
    expect(Object.keys(saveFileArgs.manualAttributions)).toHaveLength(3);
    expect(
      Object.values(saveFileArgs.manualAttributions)
        .map(({ packageName }) => packageName)
        .sort(),
    ).toEqual(['matching target', 'matching target', 'new copy']);
  });

  it('matches only a metadata-compatible candidate and compares nested objects structurally', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/source',
        '/candidate-a',
        '/candidate-b',
        '/destination',
      ]),
      manualAttributions: {
        attributions: {
          source: packageInfo('source', 'source original', {
            nested: { first: 1, second: [true, 'value'] },
            humanModified: true,
          }),
          candidateA: packageInfo('candidateA', 'same content', {
            nested: { first: 2, second: [true, 'value'] },
            humanModified: true,
          }),
          candidateB: packageInfo('candidateB', 'same content', {
            nested: { second: [true, 'value'], first: 1 },
            humanModified: true,
          }),
        },
        resourcesToAttributions: {
          '/source': ['source'],
          '/candidate-a': ['candidateA'],
          '/candidate-b': ['candidateB'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.createOrMatchAttributions({
      resourcePath: '/destination',
      attributions: {
        source: {
          id: 'source',
          criticality: Criticality.None,
          packageName: 'same content',
        },
      },
    });

    expect(await attributionUuidsOn('/destination')).toEqual(['candidateB']);
    const { result: saveFileArgs } = await getSaveFileArgs();
    expect(saveFileArgs.manualAttributions.candidateA).toHaveProperty(
      'aiAttributions',
      {
        nested: { first: 2, second: [true, 'value'] },
        humanModified: true,
      },
    );
    expect(saveFileArgs.manualAttributions.candidateB).toHaveProperty(
      'aiAttributions',
      {
        nested: { second: [true, 'value'], first: 1 },
        humanModified: true,
      },
    );
  });

  it.each(metadataMatchingCases)(
    'uses complete JSON metadata for matching: $name',
    async ({ sourceMetadata, candidateMetadata, expectedToMatch }) => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/source', '/candidate', '/destination']),
        manualAttributions: {
          attributions: {
            source: {
              ...packageInfo('source', 'same content', sourceMetadata),
              needsReview: true,
            },
            candidate: packageInfo(
              'candidate',
              'same content',
              candidateMetadata,
            ),
          },
          resourcesToAttributions: {
            '/source': ['source'],
            '/candidate': ['candidate'],
          },
          attributionsToResources: {},
        },
      });

      await mutations.createOrMatchAttributions({
        resourcePath: '/destination',
        attributions: {
          source: packageInfo('source', 'same content'),
        },
      });

      const [destinationUuid] = await attributionUuidsOn('/destination');
      expect(destinationUuid === 'candidate').toBe(expectedToMatch);
      const { result: saveFileArgs } = await getSaveFileArgs();
      expect(Object.keys(saveFileArgs.manualAttributions)).toHaveLength(
        expectedToMatch ? 2 : 3,
      );
      expect(saveFileArgs.manualAttributions.source.packageName).toBe(
        'same content',
      );
      expect(saveFileArgs.manualAttributions.source.needsReview).toBe(true);
      expect(saveFileArgs.manualAttributions[destinationUuid].packageName).toBe(
        'same content',
      );
      expect(saveFileArgs.manualAttributions[destinationUuid].needsReview).toBe(
        false,
      );
      expect(saveFileArgs.manualAttributions.candidate.packageName).toBe(
        'same content',
      );
      expect(saveFileArgs.resourcesToAttributions['/source']).toEqual([
        'source',
      ]);
      expect(saveFileArgs.resourcesToAttributions['/candidate']).toEqual([
        'candidate',
      ]);
      expect(saveFileArgs.resourcesToAttributions['/destination']).toEqual([
        destinationUuid,
      ]);
      const savedAttribution = saveFileArgs.manualAttributions[
        destinationUuid
      ] as unknown as Record<string, unknown>;
      const savedHasMetadata = Object.hasOwn(
        savedAttribution,
        'aiAttributions',
      );
      expect({
        hasMetadata: savedHasMetadata,
        metadata: savedAttribution.aiAttributions,
      }).toEqual({
        hasMetadata: sourceMetadata !== undefined,
        metadata: sourceMetadata,
      });
      const savedSource = saveFileArgs.manualAttributions[
        'source'
      ] as unknown as Record<string, unknown>;
      expect({
        hasMetadata: Object.hasOwn(savedSource, 'aiAttributions'),
        metadata: savedSource.aiAttributions,
      }).toEqual({
        hasMetadata: sourceMetadata !== undefined,
        metadata: sourceMetadata,
      });
    },
  );

  it.each([
    { submissionOrder: ['sourceA', 'sourceB'] as const },
    { submissionOrder: ['sourceB', 'sourceA'] as const },
  ])(
    'selects each compatible target in batch order $submissionOrder',
    async ({ submissionOrder }) => {
      await initializeDbWithTestData({
        resources: pathsToResources([
          '/source-a',
          '/source-b',
          '/target-a',
          '/target-b',
          '/destination',
        ]),
        manualAttributions: {
          attributions: {
            sourceA: packageInfo('sourceA', 'source A original', {
              origin: 'A',
              humanModified: true,
            }),
            sourceB: packageInfo('sourceB', 'source B original', {
              origin: 'B',
              humanModified: true,
            }),
            targetA: packageInfo('targetA', 'shared target', {
              origin: 'A',
              humanModified: true,
            }),
            targetB: packageInfo('targetB', 'shared target', {
              origin: 'B',
              humanModified: true,
            }),
          },
          resourcesToAttributions: {
            '/source-a': ['sourceA'],
            '/source-b': ['sourceB'],
            '/target-a': ['targetA'],
            '/target-b': ['targetB'],
          },
          attributionsToResources: {},
        },
      });

      const batchAttributions: Attributions = {};
      for (const sourceUuid of submissionOrder) {
        batchAttributions[sourceUuid] = packageInfo(
          sourceUuid,
          'shared target',
        );
      }
      await mutations.createOrMatchAttributions({
        resourcePath: '/destination',
        attributions: batchAttributions,
      });

      expect((await attributionUuidsOn('/destination')).sort()).toEqual(
        submissionOrder
          .map((sourceUuid) =>
            sourceUuid === 'sourceA' ? 'targetA' : 'targetB',
          )
          .sort(),
      );
      const { result: saveFileArgs } = await getSaveFileArgs();
      expect(Object.keys(saveFileArgs.manualAttributions)).toHaveLength(4);
      expect(saveFileArgs.resourcesToAttributions['/source-a']).toEqual([
        'sourceA',
      ]);
      expect(saveFileArgs.resourcesToAttributions['/source-b']).toEqual([
        'sourceB',
      ]);
      expect(saveFileArgs.resourcesToAttributions['/target-a']).toEqual([
        'targetA',
      ]);
      expect(saveFileArgs.resourcesToAttributions['/target-b']).toEqual([
        'targetB',
      ]);
      expect(
        saveFileArgs.resourcesToAttributions['/destination'].toSorted(),
      ).toEqual(
        submissionOrder
          .map((sourceUuid) =>
            sourceUuid === 'sourceA' ? 'targetA' : 'targetB',
          )
          .sort(),
      );
      expect(saveFileArgs.manualAttributions.targetA).toHaveProperty(
        'aiAttributions',
        { origin: 'A', humanModified: true },
      );
      expect(saveFileArgs.manualAttributions.targetB).toHaveProperty(
        'aiAttributions',
        { origin: 'B', humanModified: true },
      );
    },
  );

  it('keeps an edited source and its links when Global Save finds only metadata-incompatible targets', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/source', '/source-also', '/target']),
      manualAttributions: {
        attributions: {
          source: packageInfo('source', 'before', { origin: 'source' }),
          target: packageInfo('target', 'after', { origin: 'target' }),
        },
        resourcesToAttributions: {
          '/source': ['source'],
          '/source-also': ['source'],
          '/target': ['target'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.updateOrMatchAttributions({
      attributions: {
        source: packageInfo('source', 'after'),
      },
    });

    expect(await attributionUuidsOn('/source')).toEqual(['source']);
    expect(await attributionUuidsOn('/source-also')).toEqual(['source']);
    const { result: saveFileArgs } = await getSaveFileArgs();
    expect(Object.keys(saveFileArgs.manualAttributions)).toHaveLength(2);
    expect(saveFileArgs.manualAttributions.source.packageName).toBe('after');
    expect(saveFileArgs.manualAttributions.target.packageName).toBe('after');
    expect(saveFileArgs.manualAttributions.source).toHaveProperty(
      'aiAttributions',
      { origin: 'source', humanModified: true },
    );
    expect(saveFileArgs.resourcesToAttributions['/source']).toEqual(['source']);
    expect(saveFileArgs.resourcesToAttributions['/source-also']).toEqual([
      'source',
    ]);
    expect(saveFileArgs.resourcesToAttributions['/target']).toEqual(['target']);
  });

  it('creates a metadata-preserving attribution for a resource-specific edit', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/source', '/source-also', '/target']),
      manualAttributions: {
        attributions: {
          source: packageInfo('source', 'before', {
            origin: { nested: ['source'] },
          }),
          target: packageInfo('target', 'after', {
            origin: { nested: ['target'] },
          }),
        },
        resourcesToAttributions: {
          '/source': ['source'],
          '/source-also': ['source'],
          '/target': ['target'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.modifyOrMatchOnlyOnOneResource({
      resourcePath: '/source',
      attributions: {
        source: packageInfo('source', 'after'),
      },
    });

    const [editedUuid] = await attributionUuidsOn('/source');
    expect(editedUuid).not.toBe('target');
    expect(await attributionUuidsOn('/source-also')).toEqual(['source']);
    const { result: saveFileArgs } = await getSaveFileArgs();
    expect(Object.keys(saveFileArgs.manualAttributions)).toHaveLength(3);
    expect(saveFileArgs.manualAttributions.source.packageName).toBe('before');
    expect(saveFileArgs.manualAttributions[editedUuid].packageName).toBe(
      'after',
    );
    expect(saveFileArgs.manualAttributions.target.packageName).toBe('after');
    expect(saveFileArgs.manualAttributions[editedUuid]).toHaveProperty(
      'aiAttributions',
      { origin: { nested: ['source'] }, humanModified: true },
    );
    expect(saveFileArgs.manualAttributions.target).toHaveProperty(
      'aiAttributions',
      { origin: { nested: ['target'] } },
    );
    expect(saveFileArgs.resourcesToAttributions['/source']).toEqual([
      editedUuid,
    ]);
    expect(saveFileArgs.resourcesToAttributions['/source-also']).toEqual([
      'source',
    ]);
    expect(saveFileArgs.resourcesToAttributions['/target']).toEqual(['target']);
  });

  it('consolidates Global Save edits when target metadata is structurally equal', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/source', '/target']),
      manualAttributions: {
        attributions: {
          source: packageInfo('source', 'before', {
            nested: { first: 1, second: true },
            humanModified: true,
          }),
          target: packageInfo('target', 'after', {
            nested: { second: true, first: 1 },
            humanModified: true,
          }),
        },
        resourcesToAttributions: {
          '/source': ['source'],
          '/target': ['target'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.updateOrMatchAttributions({
      attributions: {
        source: packageInfo('source', 'after'),
      },
    });

    expect(await attributionUuidsOn('/source')).toEqual(['target']);
    const { result: saveFileArgs } = await getSaveFileArgs();
    expect(Object.keys(saveFileArgs.manualAttributions)).toHaveLength(1);
    expect(saveFileArgs.resourcesToAttributions['/source']).toEqual(['target']);
    expect(saveFileArgs.resourcesToAttributions['/target']).toEqual(['target']);
    expect(saveFileArgs.manualAttributions.source).toBeUndefined();
    expect(saveFileArgs.manualAttributions.target).toHaveProperty(
      'aiAttributions',
      { nested: { second: true, first: 1 }, humanModified: true },
    );
  });
});

describe('filtered-resource cache invalidation', () => {
  it('refreshes resources linked to an attribution after linking it elsewhere', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/first/file.ts', '/second/file.ts']),
      manualAttributions: {
        attributions: {
          shared: { id: 'shared', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/first/file.ts': ['shared'] },
        attributionsToResources: {},
      },
    });
    const queryLinkedResources = () =>
      queries.getLinkedResourceTree({
        expandedNodes: 'expandAll',
        onAttributionUuids: ['shared'],
      });

    expect(
      (await queryLinkedResources()).result.treeNodes.map((node) => node.id),
    ).toContain('/first/file.ts');
    expect(
      (await queryLinkedResources()).result.treeNodes.map((node) => node.id),
    ).not.toContain('/second/file.ts');

    await mutations.createOrMatchAttributions({
      resourcePath: '/second/file.ts',
      selection: { mode: 'explicit', attributionUuids: ['shared'] },
    });
    expect(
      (await queryLinkedResources()).result.treeNodes.map((node) => node.id),
    ).toContain('/second/file.ts');
  });

  it('does not invalidate the filtered-resource cache for an unrelated mutation', async () => {
    await initializeDbWithTestData({ resources: {} });
    const invalidateFilteredResourcesCache = vi.spyOn(
      await import('../resource-tree-cache'),
      'invalidateFilteredResourcesCache',
    );

    await mutations.updateRootBaseURL({ baseURL: 'https://example.com' });

    expect(invalidateFilteredResourcesCache).not.toHaveBeenCalled();
  });

  it('does not invalidate the filtered-resource cache for a rejected mutation', async () => {
    await initializeDbWithTestData({ resources: {} });
    const invalidateFilteredResourcesCache = vi.spyOn(
      await import('../resource-tree-cache'),
      'invalidateFilteredResourcesCache',
    );

    await expect(
      mutations.createOrMatchAttributions({
        resourcePath: '/missing/file.ts',
        attributions: { new: { id: 'new', criticality: Criticality.None } },
      }),
    ).rejects.toThrow();

    expect(invalidateFilteredResourcesCache).not.toHaveBeenCalled();
  });
});

describe('mutation registry decoration', () => {
  it('preserves handler types, arguments, responses, and invalidation timing', async () => {
    const invalidateBackendQueryCaches = vi.spyOn(
      await import('../queryInvalidations'),
      'invalidateBackendQueryCaches',
    );
    let resolveFirst: (response: typeof firstResponse) => void;
    const firstResponse = {
      invalidates: [{ queryName: 'getBaseUrlForSource' }],
      result: { value: 'first' },
    } as const satisfies MutationResponse;
    const first = vi.fn(
      (_params: { value: string }) =>
        new Promise<typeof firstResponse>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const secondResponse = { result: { value: 2 } } as const;
    const second = vi.fn((_params: { value: number }) =>
      Promise.resolve(secondResponse),
    );
    const registry = decorateMutationRegistry({ first, second });

    expectTypeOf(registry.first)
      .parameter(0)
      .toEqualTypeOf<{ value: string }>();
    expectTypeOf(registry.second)
      .parameter(0)
      .toEqualTypeOf<{ value: number }>();
    expectTypeOf(registry.first).returns.toEqualTypeOf<
      Promise<typeof firstResponse>
    >();
    expectTypeOf(registry.second).returns.toEqualTypeOf<
      Promise<typeof secondResponse>
    >();

    const firstResult = registry.first({ value: 'first' });
    expect(invalidateBackendQueryCaches).not.toHaveBeenCalled();
    resolveFirst!(firstResponse);
    expect(await firstResult).toBe(firstResponse);
    expect(await registry.second({ value: 2 })).toBe(secondResponse);
    expect(first).toHaveBeenCalledWith({ value: 'first' });
    expect(second).toHaveBeenCalledWith({ value: 2 });
    expect(invalidateBackendQueryCaches).toHaveBeenNthCalledWith(
      1,
      firstResponse.invalidates,
    );
    expect(invalidateBackendQueryCaches).toHaveBeenNthCalledWith(2, []);
  });
});

describe('mixed attribution mutations', () => {
  async function initializeMixedAttribution() {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/readonly/file.ts',
        '/writable/file.ts',
        '/writable/replacement.ts',
      ]),
      manualAttributions: {
        attributions: {
          shared: {
            id: 'shared',
            criticality: Criticality.None,
            packageName: 'original',
          },
          replacement: {
            id: 'replacement',
            criticality: Criticality.None,
            packageName: 'replacement',
          },
        },
        resourcesToAttributions: {
          '/readonly/file.ts': ['shared'],
          '/writable/file.ts': ['shared'],
          '/writable/replacement.ts': ['replacement'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });
  }

  it('clones a mixed attribution before updating its writable partition', async () => {
    await initializeMixedAttribution();
    await getDb()
      .insertInto('attribution_ai')
      .values({
        attribution_uuid: 'shared',
        additional_data: '{"origin":{"nested":[1,true]}}',
      })
      .execute();

    await mutations.updateAttributions({
      attributions: {
        shared: {
          id: 'shared',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });

    expect(await attributionUuidsOn('/readonly/file.ts')).toEqual(['shared']);
    const writableUuids = await attributionUuidsOn('/writable/file.ts');
    expect(writableUuids).toHaveLength(1);
    expect(writableUuids).not.toContain('shared');
    expect(await resourceAccessOf('shared')).toBe(
      AttributionResourceAccess.Readonly,
    );
    expect(await resourceAccessOf(writableUuids[0])).toBe(
      AttributionResourceAccess.Writable,
    );
    expect(
      await getDb()
        .selectFrom('attribution')
        .select('package_name')
        .where('uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).toEqual({ package_name: 'original' });
    expect(
      await getDb()
        .selectFrom('attribution')
        .select('package_name')
        .where('uuid', '=', writableUuids[0])
        .executeTakeFirstOrThrow(),
    ).toEqual({ package_name: 'updated' });
    expect(
      await getDb()
        .selectFrom('attribution_ai')
        .select(['additional_data', 'human_modified'])
        .where('attribution_uuid', '=', writableUuids[0])
        .executeTakeFirstOrThrow(),
    ).toEqual({
      additional_data: '{"origin":{"nested":[1,true]}}',
      human_modified: 1,
    });
    expect(
      await getDb()
        .selectFrom('attribution_ai')
        .select('human_modified')
        .where('attribution_uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).toEqual({ human_modified: null });
  });

  it('returns the writable clone UUID after updating a mixed attribution', async () => {
    await initializeMixedAttribution();

    await mutations.updateAttributions({
      attributions: {
        shared: {
          id: 'shared',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });

    const cloneUuid = (
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('package_name', '=', 'updated')
        .executeTakeFirstOrThrow()
    ).uuid;
    expect(cloneUuid).not.toBe('shared');
  });

  it('keeps the locked relationship unchanged immediately after updating a mixed attribution', async () => {
    await initializeMixedAttribution();

    await mutations.updateAttributions({
      attributions: {
        shared: {
          id: 'shared',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });
    const cloneUuid = (
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('package_name', '=', 'updated')
        .executeTakeFirstOrThrow()
    ).uuid;
    const { result: page } = await listAttributionsPage({
      external: false,
      resourcePathForRelationships: '/readonly/file.ts',
      includeReadonly: true,
      filters: [],
      search: '',
      valueFilters: {},
      showResolved: true,
      excludeUnrelated: false,
      scope: { mode: 'all' },
      sort: 'alphabetically',
      offset: 0,
      limit: 200,
    });
    const result = page.attributions;

    expect(result.shared).toMatchObject({
      relation: 'resource',
      packageName: 'original',
    });
    expect(result[cloneUuid]).toMatchObject({
      relation: 'unrelated',
      packageName: 'updated',
    });
  });

  it('clones a mixed attribution before deleting its writable partition', async () => {
    await initializeMixedAttribution();
    await getDb()
      .insertInto('attribution_ai')
      .values({
        attribution_uuid: 'shared',
        additional_data: '{}',
        human_modified: 0,
      })
      .execute();

    await mutations.deleteAttributions({
      selection: { mode: 'explicit', attributionUuids: ['shared'] },
    });

    expect(await attributionUuidsOn('/readonly/file.ts')).toEqual(['shared']);
    expect(await attributionUuidsOn('/writable/file.ts')).toEqual([]);
    expect(
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('uuid', '=', 'shared')
        .executeTakeFirst(),
    ).toEqual({ uuid: 'shared' });
    expect(await resourceAccessOf('shared')).toBe(
      AttributionResourceAccess.Readonly,
    );
    await expect(
      getDb()
        .selectFrom('attribution')
        .select('package_name')
        .where('uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ package_name: 'original' });
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select('human_modified')
        .where('attribution_uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ human_modified: 0 });
  });

  it('clones a mixed attribution before replacing its writable partition', async () => {
    await initializeMixedAttribution();
    await getDb()
      .insertInto('attribution_ai')
      .values([
        {
          attribution_uuid: 'shared',
          additional_data: '{}',
          human_modified: 0,
        },
        {
          attribution_uuid: 'replacement',
          additional_data: '{}',
          human_modified: 0,
        },
      ])
      .execute();

    await mutations.replaceAttributions({
      selection: { mode: 'explicit', attributionUuids: ['shared'] },
      attributionUuidToReplaceWith: 'replacement',
    });

    expect(await attributionUuidsOn('/readonly/file.ts')).toEqual(['shared']);
    expect(await attributionUuidsOn('/writable/file.ts')).toEqual([
      'replacement',
    ]);
    expect(await resourceAccessOf('shared')).toBe(
      AttributionResourceAccess.Readonly,
    );
    expect(await resourceAccessOf('replacement')).toBe(
      AttributionResourceAccess.Writable,
    );
    await expect(
      getDb()
        .selectFrom('attribution')
        .select('package_name')
        .where('uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ package_name: 'original' });
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select('human_modified')
        .where('attribution_uuid', '=', 'replacement')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ human_modified: 0 });
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select('human_modified')
        .where('attribution_uuid', '=', 'shared')
        .executeTakeFirstOrThrow(),
    ).resolves.toEqual({ human_modified: 0 });
  });

  it('matches mixed attribution edits using the writable clone metadata', async () => {
    await initializeMixedAttribution();
    await getDb()
      .insertInto('attribution_ai')
      .values([
        {
          attribution_uuid: 'shared',
          additional_data: '{"origin":{"value":"source"}}',
        },
        {
          attribution_uuid: 'replacement',
          additional_data: '{"origin":{"value":"target"}}',
        },
      ])
      .execute();

    await mutations.updateOrMatchAttributions({
      attributions: {
        shared: {
          id: 'shared',
          criticality: Criticality.None,
          packageName: 'replacement',
        },
      },
    });

    expect(await attributionUuidsOn('/readonly/file.ts')).toEqual(['shared']);
    const [writableUuid] = await attributionUuidsOn('/writable/file.ts');
    expect(writableUuid).not.toBe('shared');
    expect(writableUuid).not.toBe('replacement');
    const { result: saveFileArgs } = await getSaveFileArgs();
    expect(saveFileArgs.manualAttributions.shared.packageName).toBe('original');
    expect(saveFileArgs.manualAttributions[writableUuid].packageName).toBe(
      'replacement',
    );
    expect(saveFileArgs.manualAttributions[writableUuid]).toHaveProperty(
      'aiAttributions',
      { origin: { value: 'source' }, humanModified: true },
    );
    expect(saveFileArgs.manualAttributions.replacement).toHaveProperty(
      'aiAttributions',
      { origin: { value: 'target' } },
    );
  });
});

describe('bulk attribution mutations', () => {
  const simultaneousAttributionResources = {
    first: '/writable/first.ts',
    second: '/writable/second.ts',
  } as const;
  const simultaneousAttributions: Attributions = {
    first: {
      id: 'first',
      criticality: Criticality.None,
      packageName: 'first',
    },
    second: {
      id: 'second',
      criticality: Criticality.None,
      packageName: 'second',
    },
  };
  it('excludes the replacement target from a query-wide replacement', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          first: { id: 'first', criticality: Criticality.None },
          second: { id: 'second', criticality: Criticality.None },
          replacement: {
            id: 'replacement',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: {
          '/parent/child.ts': ['first', 'second', 'replacement'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.replaceAttributions({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: [],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/child.ts',
          showResolved: true,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: [],
      },
      attributionUuidToReplaceWith: 'replacement',
    });

    expect(
      await getDb()
        .selectFrom('resource_to_attribution as rta')
        .innerJoin('resource as r', 'r.id', 'rta.resource_id')
        .select('rta.attribution_uuid')
        .where('r.path', '=', '/parent/child.ts')
        .execute(),
    ).toEqual([{ attribution_uuid: 'replacement' }]);
  });

  it('applies a query-wide property update with exclusions', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          first: { id: 'first', criticality: Criticality.None },
          second: { id: 'second', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/child.ts': ['first', 'second'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.updateAttributionProperty({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: [],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/child.ts',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: ['second'],
      },
      property: 'needsReview',
      value: true,
    });
    const rows = await getDb()
      .selectFrom('attribution')
      .select(['uuid', 'needs_review'])
      .orderBy('uuid')
      .execute();

    expect(rows).toEqual([
      { uuid: 'first', needs_review: 1 },
      { uuid: 'second', needs_review: 0 },
    ]);
  });

  it('reports whether the focused attribution participates in query-wide deletion', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          focused: { id: 'focused', criticality: Criticality.None },
          excluded: { id: 'excluded', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/child.ts': ['focused', 'excluded'],
        },
        attributionsToResources: {},
      },
    });

    const selection = {
      mode: 'allMatching' as const,
      query: {
        external: false,
        filters: [],
        search: '',
        valueFilters: {},
        resourcePathForRelationships: '/parent/child.ts',
        showResolved: false,
        excludeUnrelated: false,
        relation: 'resource' as const,
      },
      excludedAttributionUuids: ['excluded'],
    };

    const affectedResponse = await mutations.deleteAttributions({
      selection,
      focusedAttributionUuid: 'focused',
    });
    expect(affectedResponse.result).toEqual({
      focusedAttributionOutcome: {
        status: 'removed',
        attributionUuid: 'focused',
      },
    });

    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          focused: { id: 'focused', criticality: Criticality.None },
          excluded: { id: 'excluded', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/child.ts': ['focused', 'excluded'],
        },
        attributionsToResources: {},
      },
    });

    const excludedResponse = await mutations.deleteAttributions({
      selection,
      focusedAttributionUuid: 'excluded',
    });
    expect(excludedResponse.result).toEqual({
      focusedAttributionOutcome: { status: 'unchanged' },
    });
  });

  it('preserves a focused edit during a query-wide property update', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          focused: {
            id: 'focused',
            criticality: Criticality.None,
            packageName: 'before',
          },
          other: {
            id: 'other',
            criticality: Criticality.None,
            packageName: 'other',
          },
        },
        resourcesToAttributions: {
          '/parent/child.ts': ['focused', 'other'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.updateAttributionProperty({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: [],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/child.ts',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: [],
      },
      property: 'needsReview',
      value: true,
      attributions: {
        focused: {
          id: 'focused',
          criticality: Criticality.None,
          packageName: 'after',
        },
      },
      focusedAttributionUuid: 'focused',
    });

    const rows = await getDb()
      .selectFrom('attribution')
      .select(['uuid', 'package_name', 'needs_review'])
      .orderBy('uuid')
      .execute();

    expect(rows).toEqual([
      { uuid: 'focused', package_name: 'after', needs_review: 1 },
      { uuid: 'other', package_name: 'other', needs_review: 1 },
    ]);
  });

  it('returns the focused remapping for a query-wide update-or-match', async () => {
    const focused = {
      id: 'focused',
      criticality: Criticality.None,
      packageName: 'matching-package',
      preSelected: true,
    };
    const matching = {
      ...focused,
      id: 'matching',
      preSelected: undefined,
    };
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: { focused, matching },
        resourcesToAttributions: {
          '/parent/child.ts': [focused.id, matching.id],
        },
        attributionsToResources: {},
      },
    });

    const response = await mutations.updateOrMatchAttributions({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: ['preSelected'],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/child.ts',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: [],
      },
      focusedAttributionUuid: focused.id,
    });

    expect(response.result.focusedAttributionOutcome).toEqual({
      status: 'remapped',
      attributionUuid: focused.id,
      newAttributionUuid: matching.id,
    });
  });

  it('applies a focused override during a query-wide update-or-match', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          focused: {
            id: 'focused',
            criticality: Criticality.None,
            packageName: 'before',
            preSelected: true,
          },
          other: {
            id: 'other',
            criticality: Criticality.None,
            packageName: 'other',
            preSelected: true,
          },
        },
        resourcesToAttributions: {
          '/parent/child.ts': ['focused', 'other'],
        },
        attributionsToResources: {},
      },
    });

    await mutations.updateOrMatchAttributions({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: ['preSelected'],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/child.ts',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: [],
      },
      attributions: {
        focused: {
          id: 'focused',
          criticality: Criticality.None,
          packageName: 'after',
          preSelected: true,
        },
      },
      focusedAttributionUuid: 'focused',
    });

    const attributions = await getDb()
      .selectFrom('attribution')
      .select(['uuid', 'package_name', 'pre_selected'])
      .where('uuid', 'in', ['focused', 'other'])
      .orderBy('uuid')
      .execute();

    expect(attributions).toEqual([
      { uuid: 'focused', package_name: 'after', pre_selected: 0 },
      { uuid: 'other', package_name: 'other', pre_selected: 0 },
    ]);
    expect(await attributionUuidsOn('/parent/child.ts')).toEqual([
      'focused',
      'other',
    ]);
  });

  const simultaneousSubmissionOrders = [
    { submissionOrder: ['first', 'second'] },
    { submissionOrder: ['second', 'first'] },
  ] as const;

  async function initializeWritableSimultaneousAttributions() {
    await initializeDbWithTestData({
      resources: pathsToResources(
        Object.values(simultaneousAttributionResources),
      ),
      manualAttributions: {
        attributions: simultaneousAttributions,
        resourcesToAttributions: {
          [simultaneousAttributionResources.first]: ['first'],
          [simultaneousAttributionResources.second]: ['second'],
        },
        attributionsToResources: {},
      },
    });
  }

  function inSubmissionOrder(
    attributions: Attributions,
    submissionOrder: ReadonlyArray<'first' | 'second'>,
  ) {
    return Object.fromEntries(
      submissionOrder.map((uuid) => [uuid, attributions[uuid]]),
    );
  }

  const swappedDrafts: Attributions = {
    first: { ...simultaneousAttributions.first, packageName: 'second' },
    second: { ...simultaneousAttributions.second, packageName: 'first' },
  };
  const convergedDrafts: Attributions = {
    first: { ...simultaneousAttributions.first, packageName: 'same' },
    second: { ...simultaneousAttributions.second, packageName: 'same' },
  };
  const mergedDrafts: Attributions = {
    first: { ...simultaneousAttributions.first, packageName: 'merged' },
    second: { ...simultaneousAttributions.second, packageName: 'merged' },
  };

  it.each(simultaneousSubmissionOrders)(
    'avoids matching against unfinished edits when swapping values in $submissionOrder order',
    async ({ submissionOrder }) => {
      await initializeWritableSimultaneousAttributions();

      const response = await mutations.updateOrMatchAttributions({
        attributions: inSubmissionOrder(swappedDrafts, submissionOrder),
        focusedAttributionUuid: 'first',
      });

      expect(response.result.focusedAttributionOutcome).toEqual({
        status: 'unchanged',
      });
      await expect(
        getDb()
          .selectFrom('attribution')
          .select(['uuid', 'package_name'])
          .orderBy('uuid')
          .execute(),
      ).resolves.toEqual([
        { uuid: 'first', package_name: 'second' },
        { uuid: 'second', package_name: 'first' },
      ]);
      expect(
        await attributionUuidsOn(simultaneousAttributionResources.first),
      ).toEqual(['first']);
      expect(
        await attributionUuidsOn(simultaneousAttributionResources.second),
      ).toEqual(['second']);
    },
  );

  it.each(simultaneousSubmissionOrders)(
    'consolidates simultaneous identical final drafts in $submissionOrder order',
    async ({ submissionOrder }) => {
      await initializeWritableSimultaneousAttributions();

      const response = await mutations.updateOrMatchAttributions({
        attributions: inSubmissionOrder(convergedDrafts, submissionOrder),
        focusedAttributionUuid: submissionOrder[1],
      });
      const firstResourceAttribution = await attributionUuidsOn(
        simultaneousAttributionResources.first,
      );
      const secondResourceAttribution = await attributionUuidsOn(
        simultaneousAttributionResources.second,
      );
      const survivorUuid = firstResourceAttribution[0];

      expect(firstResourceAttribution).toHaveLength(1);
      expect(secondResourceAttribution).toEqual([survivorUuid]);
      expect(
        await getDb().selectFrom('attribution').selectAll().execute(),
      ).toHaveLength(1);
      await expect(
        getDb()
          .selectFrom('attribution')
          .select(['uuid', 'package_name'])
          .execute(),
      ).resolves.toEqual([{ uuid: survivorUuid, package_name: 'same' }]);
      expect(response.result.focusedAttributionOutcome).toEqual({
        status: 'remapped',
        attributionUuid: submissionOrder[1],
        newAttributionUuid: survivorUuid,
      });
    },
  );

  const mixedSimultaneousResources = {
    firstReadonly: '/readonly/first.ts',
    firstWritable: '/writable/first.ts',
    secondReadonly: '/readonly/second.ts',
    secondWritable: '/writable/second.ts',
  } as const;

  async function initializeMixedSimultaneousAttributions() {
    await initializeDbWithTestData({
      resources: pathsToResources(Object.values(mixedSimultaneousResources)),
      manualAttributions: {
        attributions: simultaneousAttributions,
        resourcesToAttributions: {
          [mixedSimultaneousResources.firstReadonly]: ['first'],
          [mixedSimultaneousResources.firstWritable]: ['first'],
          [mixedSimultaneousResources.secondReadonly]: ['second'],
          [mixedSimultaneousResources.secondWritable]: ['second'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });
  }

  async function expectMixedAttributionState({
    firstWritableUuid,
    secondWritableUuid,
    firstWritablePackageName,
    secondWritablePackageName,
    count,
  }: {
    firstWritableUuid: string;
    secondWritableUuid: string;
    firstWritablePackageName: string;
    secondWritablePackageName: string;
    count: number;
  }) {
    expect(
      await attributionUuidsOn(mixedSimultaneousResources.firstReadonly),
    ).toEqual(['first']);
    expect(
      await attributionUuidsOn(mixedSimultaneousResources.secondReadonly),
    ).toEqual(['second']);
    expect(
      await attributionUuidsOn(mixedSimultaneousResources.firstWritable),
    ).toEqual([firstWritableUuid]);
    expect(
      await attributionUuidsOn(mixedSimultaneousResources.secondWritable),
    ).toEqual([secondWritableUuid]);
    expect(firstWritableUuid).not.toBe('first');
    expect(secondWritableUuid).not.toBe('second');

    const rows = await getDb()
      .selectFrom('attribution')
      .select(['uuid', 'package_name', 'resource_access'])
      .orderBy('uuid')
      .execute();
    const writableRows = [
      {
        uuid: firstWritableUuid,
        package_name: firstWritablePackageName,
        resource_access: AttributionResourceAccess.Writable,
      },
      ...(firstWritableUuid === secondWritableUuid
        ? []
        : [
            {
              uuid: secondWritableUuid,
              package_name: secondWritablePackageName,
              resource_access: AttributionResourceAccess.Writable,
            },
          ]),
    ];
    expect(rows).toHaveLength(count);
    expect(rows.map(({ uuid }) => uuid).sort()).toEqual(
      ['first', 'second', ...writableRows.map(({ uuid }) => uuid)].sort(),
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          uuid: 'first',
          package_name: 'first',
          resource_access: AttributionResourceAccess.Readonly,
        },
        {
          uuid: 'second',
          package_name: 'second',
          resource_access: AttributionResourceAccess.Readonly,
        },
        ...writableRows,
      ]),
    );
  }

  it.each(simultaneousSubmissionOrders)(
    'preserves separate mixed resource relationships when swapping values in $submissionOrder order',
    async ({ submissionOrder }) => {
      await initializeMixedSimultaneousAttributions();

      const response = await mutations.updateOrMatchAttributions({
        attributions: inSubmissionOrder(swappedDrafts, submissionOrder),
        focusedAttributionUuid: 'first',
      });
      const firstWritableUuid = (
        await attributionUuidsOn(mixedSimultaneousResources.firstWritable)
      )[0];
      const secondWritableUuid = (
        await attributionUuidsOn(mixedSimultaneousResources.secondWritable)
      )[0];

      expect(firstWritableUuid).not.toBe(secondWritableUuid);
      await expectMixedAttributionState({
        firstWritableUuid,
        secondWritableUuid,
        firstWritablePackageName: 'second',
        secondWritablePackageName: 'first',
        count: 4,
      });
      expect(response.result.focusedAttributionOutcome).toEqual({
        status: 'remapped',
        attributionUuid: 'first',
        newAttributionUuid: firstWritableUuid,
      });
    },
  );

  it.each(simultaneousSubmissionOrders)(
    'consolidates mixed writable relationships for identical final drafts in $submissionOrder order',
    async ({ submissionOrder }) => {
      await initializeMixedSimultaneousAttributions();

      const response = await mutations.updateOrMatchAttributions({
        attributions: inSubmissionOrder(mergedDrafts, submissionOrder),
        focusedAttributionUuid: 'first',
      });
      const firstWritableUuid = (
        await attributionUuidsOn(mixedSimultaneousResources.firstWritable)
      )[0];
      const secondWritableUuid = (
        await attributionUuidsOn(mixedSimultaneousResources.secondWritable)
      )[0];

      const survivorUuid = firstWritableUuid;
      expect(firstWritableUuid).toBe(secondWritableUuid);
      await expectMixedAttributionState({
        firstWritableUuid,
        secondWritableUuid,
        firstWritablePackageName: 'merged',
        secondWritablePackageName: 'merged',
        count: 3,
      });
      expect(response.result.focusedAttributionOutcome).toEqual({
        status: 'remapped',
        attributionUuid: 'first',
        newAttributionUuid: survivorUuid,
      });
    },
  );

  it('keeps zero and absent confidence distinct when consolidating drafts', async () => {
    const resource = '/parent/child.ts';
    await initializeDbWithTestData({
      resources: pathsToResources([resource]),
      manualAttributions: {
        attributions: {
          zero: {
            id: 'zero',
            criticality: Criticality.None,
            packageName: 'same',
            attributionConfidence: 10,
          },
          absent: {
            id: 'absent',
            criticality: Criticality.None,
            packageName: 'other',
          },
        },
        resourcesToAttributions: { [resource]: ['zero', 'absent'] },
        attributionsToResources: {},
      },
    });

    await mutations.updateOrMatchAttributions({
      attributions: {
        zero: {
          id: 'zero',
          criticality: Criticality.None,
          packageName: 'same',
          attributionConfidence: 0,
        },
        absent: {
          id: 'absent',
          criticality: Criticality.None,
          packageName: 'same',
        },
      },
    });

    await expect(
      getDb()
        .selectFrom('attribution')
        .select(['uuid', 'attribution_confidence'])
        .where('uuid', 'in', ['zero', 'absent'])
        .orderBy('uuid')
        .execute(),
    ).resolves.toEqual([
      { uuid: 'absent', attribution_confidence: null },
      { uuid: 'zero', attribution_confidence: 0 },
    ]);
  });

  const existingTargetResources = {
    ...simultaneousAttributionResources,
    target: '/writable/target.ts',
  } as const;
  const existingTargetAttribution = {
    id: 'target',
    criticality: Criticality.None,
    packageName: 'target',
  };

  async function initializeAttributionsWithExistingTarget() {
    await initializeDbWithTestData({
      resources: pathsToResources(Object.values(existingTargetResources)),
      manualAttributions: {
        attributions: {
          ...simultaneousAttributions,
          target: existingTargetAttribution,
        },
        resourcesToAttributions: {
          [existingTargetResources.first]: ['first'],
          [existingTargetResources.second]: ['second'],
          [existingTargetResources.target]: ['target'],
        },
        attributionsToResources: {},
      },
    });
  }

  const targetDrafts: Attributions = {
    first: {
      ...simultaneousAttributions.first,
      packageName: existingTargetAttribution.packageName,
    },
    second: {
      ...simultaneousAttributions.second,
      packageName: existingTargetAttribution.packageName,
    },
  };

  it.each([
    { submissionOrder: ['first', 'second'], focusedAttributionUuid: 'first' },
    { submissionOrder: ['first', 'second'], focusedAttributionUuid: 'second' },
    { submissionOrder: ['second', 'first'], focusedAttributionUuid: 'first' },
    { submissionOrder: ['second', 'first'], focusedAttributionUuid: 'second' },
  ] as const)(
    'converges onto an existing target for $submissionOrder order and $focusedAttributionUuid focus',
    async ({ submissionOrder, focusedAttributionUuid }) => {
      await initializeAttributionsWithExistingTarget();
      const targetBefore = await getDb()
        .selectFrom('attribution')
        .selectAll()
        .where('uuid', '=', 'target')
        .executeTakeFirstOrThrow();

      const response = await mutations.updateOrMatchAttributions({
        attributions: inSubmissionOrder(targetDrafts, submissionOrder),
        focusedAttributionUuid,
      });

      await expect(
        getDb()
          .selectFrom('attribution')
          .select(['uuid', 'package_name'])
          .execute(),
      ).resolves.toEqual([{ uuid: 'target', package_name: 'target' }]);
      await expect(
        getDb()
          .selectFrom('attribution')
          .selectAll()
          .where('uuid', '=', 'target')
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual(targetBefore);
      expect(await attributionUuidsOn(existingTargetResources.first)).toEqual([
        'target',
      ]);
      expect(await attributionUuidsOn(existingTargetResources.second)).toEqual([
        'target',
      ]);
      expect(await attributionUuidsOn(existingTargetResources.target)).toEqual([
        'target',
      ]);
      expect(response.result.focusedAttributionOutcome).toEqual({
        status: 'remapped',
        attributionUuid: focusedAttributionUuid,
        newAttributionUuid: 'target',
      });
    },
  );

  it('links 500 distinct attributions without exceeding the SQLite expression depth', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          existing: {
            id: 'existing',
            criticality: Criticality.None,
            packageName: 'existing',
          },
        },
        resourcesToAttributions: { '/parent/child.ts': ['existing'] },
        attributionsToResources: {},
      },
    });

    const attributions = Object.fromEntries(
      Array.from({ length: 500 }, (_, index) => {
        const id = `signal-${index}`;
        return [
          id,
          {
            id,
            criticality: Criticality.None,
            packageName: `package-${index}`,
          },
        ];
      }),
    );

    await mutations.createOrMatchAttributions({
      resourcePath: '/parent/child.ts',
      attributions,
    });
    const createdAttributionUuids = (
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('package_name', 'like', 'package-%')
        .execute()
    ).map(({ uuid }) => uuid);
    const linkedAttributionUuids = (
      await getDb()
        .selectFrom('resource_to_attribution as rta')
        .innerJoin('resource', 'resource.id', 'rta.resource_id')
        .select('rta.attribution_uuid')
        .where('resource.path', '=', '/parent/child.ts')
        .execute()
    ).map(({ attribution_uuid }) => attribution_uuid);

    expect(createdAttributionUuids).toHaveLength(500);
    expect(linkedAttributionUuids).toHaveLength(501);
  });
});

describe('readonly-only attribution mutations', () => {
  async function initializeReadonlyAttribution() {
    await initializeDbWithTestData({
      resources: pathsToResources(['/readonly/file.ts']),
      manualAttributions: {
        attributions: {
          readonly: { id: 'readonly', criticality: Criticality.None },
          replacement: { id: 'replacement', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/readonly/file.ts': ['readonly'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });
  }

  it.each([
    {
      name: 'deleting',
      mutate: () =>
        mutations.deleteAttributions({
          selection: { mode: 'explicit', attributionUuids: ['readonly'] },
        }),
    },
    {
      name: 'replacing',
      mutate: () =>
        mutations.replaceAttributions({
          selection: { mode: 'explicit', attributionUuids: ['readonly'] },
          attributionUuidToReplaceWith: 'replacement',
        }),
    },
    {
      name: 'updating',
      mutate: () =>
        mutations.updateAttributions({
          attributions: {
            readonly: {
              id: 'readonly',
              criticality: Criticality.None,
              packageName: 'updated',
            },
          },
        }),
    },
    {
      name: 'update-or-matching',
      mutate: () =>
        mutations.updateOrMatchAttributions({
          attributions: {
            readonly: {
              id: 'readonly',
              criticality: Criticality.None,
              packageName: 'updated',
            },
          },
        }),
    },
  ])('rejects $name a readonly-only attribution', async ({ mutate }) => {
    await initializeReadonlyAttribution();

    await expect(mutate()).rejects.toThrow(
      /readonly attributions can't be modified/i,
    );
  });
});

describe('createOrMatchAttributions redundant link', () => {
  it('collapses the resource to inherit from its ancestor when linking makes the sets equal, changing its display (from own a to inherited a and b), so the link is not a no-op', async () => {
    const signalB = {
      id: 'signal-b',
      criticality: Criticality.None,
      packageName: 'pkg-b',
      licenseName: 'MIT',
    };
    await initializeDbWithTestData({
      resources: pathsToResources(['/p', '/p/child.ts']),
      externalAttributions: {
        attributions: { 'signal-b': signalB },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      manualAttributions: {
        attributions: {
          a: {
            id: 'a',
            criticality: Criticality.None,
            packageName: 'pkg-a',
            licenseName: 'Apache-2.0',
          },
          b: { ...signalB, id: 'b' },
        },
        resourcesToAttributions: {
          '/p': ['a', 'b'],
          '/p/child.ts': ['a'],
        },
        attributionsToResources: {},
      },
    });

    const { result: linkStatus } = await queries.getAttributionLinkStatus({
      resourcePath: '/p/child.ts',
      attributionUuid: 'signal-b',
    });
    expect(linkStatus.linkWouldBeRedundant).toBe(false);

    await mutations.createOrMatchAttributions({
      resourcePath: '/p/child.ts',
      attributions: { 'signal-b': signalB },
    });

    expect(await attributionUuidsOn('/p/child.ts')).toEqual([]);
    expect((await attributionUuidsOn('/p')).toSorted()).toEqual(['a', 'b']);
  });
});
