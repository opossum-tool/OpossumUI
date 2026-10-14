// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from '../../db/db';
import { AttributionResourceAccess } from '../../types/types';
import { getSaveFileArgs } from '../getSaveFileArgs';
import { mutations } from '../mutations';
import {
  attributionFixture,
  initializeAiAttributionFixture,
  linkedAttributionIds,
  readAiMetadata,
  resourceAccessOf,
} from './ai-attribution-test-helpers';

const flagMatrixCases: Array<{
  sourceFlag: boolean | undefined;
  targetFlag: boolean | undefined;
  resultingFlag: boolean | undefined;
}> = [
  { sourceFlag: undefined, targetFlag: undefined, resultingFlag: undefined },
  { sourceFlag: undefined, targetFlag: false, resultingFlag: undefined },
  { sourceFlag: undefined, targetFlag: true, resultingFlag: undefined },
  { sourceFlag: false, targetFlag: undefined, resultingFlag: undefined },
  {
    sourceFlag: false,
    targetFlag: false,
    resultingFlag: false,
  },
  {
    sourceFlag: false,
    targetFlag: true,
    resultingFlag: false,
  },
  { sourceFlag: true, targetFlag: undefined, resultingFlag: undefined },
  {
    sourceFlag: true,
    targetFlag: false,
    resultingFlag: false,
  },
  {
    sourceFlag: true,
    targetFlag: true,
    resultingFlag: true,
  },
];

describe('AI attribution matching', () => {
  it.each([undefined, false, true])(
    'keeps an external signal separate from an AI target with humanModified=%s',
    async (humanModified) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/existing', '/external'],
        attributions: {
          existing: attributionFixture('existing', {
            packageName: 'matching',
            aiAttributions: { origin: 'target', humanModified },
          }),
        },
        resourceLinks: { '/existing': ['existing'] },
        externalAttributions: {
          signal: attributionFixture('signal', { packageName: 'matching' }),
        },
        externalResourceLinks: { '/external': ['signal'] },
      });
      await mutations.createOrMatchAttributions({
        resourcePath: '/external',
        attributions: {
          copy: attributionFixture('signal', { packageName: 'matching' }),
        },
      });
      const { result: saved } = await getSaveFileArgs();
      const destinationUuids = saved.resourcesToAttributions['/external'];
      expect(destinationUuids).toHaveLength(1);
      const [destinationUuid] = destinationUuids;
      expect(destinationUuid).not.toBe('existing');
      expect(saved.manualAttributions[destinationUuid].packageName).toBe(
        'matching',
      );
      expect(saved.manualAttributions[destinationUuid]).not.toHaveProperty(
        'aiAttributions',
      );
      expect(saved.resourcesToAttributions['/existing']).toEqual(['existing']);
      expect(Object.keys(saved.manualAttributions)).toHaveLength(2);
      await expect(
        getDb().selectFrom('attribution_ai').selectAll().execute(),
      ).resolves.toEqual([
        {
          attribution_uuid: 'existing',
          additional_data: '{"origin":"target"}',
          human_modified:
            humanModified === undefined ? null : Number(humanModified),
        },
      ]);
    },
  );

  it.each(flagMatrixCases)(
    'consolidates source flag $sourceFlag with target flag $targetFlag according to the flag matrix',
    async ({ sourceFlag, targetFlag, resultingFlag }) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/target', '/destination'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'same content',
            aiAttributions: {
              opaque: { value: 1 },
              humanModified: sourceFlag,
            },
          }),
          target: {
            ...attributionFixture('target', {
              packageName: 'same content',
              aiAttributions: {
                opaque: { value: 1 },
                humanModified: targetFlag,
              },
            }),
            needsReview: true,
          },
        },
        resourceLinks: {
          '/source': ['source'],
          '/target': ['target'],
        },
      });

      await mutations.createOrMatchAttributions({
        resourcePath: '/destination',
        attributions: {
          source: {
            ...attributionFixture('source', { packageName: 'same content' }),
            needsReview: true,
          },
        },
      });

      const [destinationUuid] = await linkedAttributionIds('/destination');
      expect(destinationUuid).toBe('target');
      const { result: saved } = await getSaveFileArgs();
      expect(Object.keys(saved.manualAttributions)).toHaveLength(2);
      expect(saved.resourcesToAttributions['/destination']).toEqual([
        destinationUuid,
      ]);
      expect(saved.manualAttributions[destinationUuid]).toHaveProperty(
        'aiAttributions',
        {
          opaque: { value: 1 },
          ...(resultingFlag === undefined
            ? {}
            : { humanModified: resultingFlag }),
        },
      );
    },
  );

  it('prefers an already-false target when multiple AI candidates are eligible', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: [
        '/source',
        '/target-true',
        '/target-false',
        '/destination',
      ],
      attributions: {
        source: attributionFixture('source', {
          packageName: 'before',
          aiAttributions: {
            opaque: { shared: true },
            humanModified: true,
          },
        }),
        targetTrue: attributionFixture('targetTrue', {
          packageName: 'after',
          aiAttributions: {
            opaque: { shared: true },
            humanModified: true,
          },
        }),
        targetFalse: attributionFixture('targetFalse', {
          packageName: 'after',
          aiAttributions: {
            opaque: { shared: true },
            humanModified: false,
          },
        }),
      },
      resourceLinks: {
        '/source': ['source'],
        '/target-true': ['targetTrue'],
        '/target-false': ['targetFalse'],
      },
    });

    await mutations.createOrMatchAttributions({
      resourcePath: '/destination',
      attributions: {
        source: attributionFixture('source', { packageName: 'after' }),
      },
    });

    expect(await linkedAttributionIds('/destination')).toEqual(['targetFalse']);
    const { result: saved } = await getSaveFileArgs();
    expect(Object.keys(saved.manualAttributions)).toHaveLength(3);
    expect(saved.manualAttributions.targetFalse).toHaveProperty(
      'aiAttributions',
      { opaque: { shared: true }, humanModified: false },
    );
    expect(saved.manualAttributions.targetTrue).toHaveProperty(
      'aiAttributions',
      { opaque: { shared: true }, humanModified: true },
    );
  });

  it.each(
    flagMatrixCases.flatMap(({ sourceFlag, targetFlag, resultingFlag }) =>
      ['readonly', 'mixed'].map((access) => ({
        access,
        sourceFlag,
        targetFlag,
        shouldMatch: resultingFlag === targetFlag,
      })),
    ),
  )(
    'consolidates source flag $sourceFlag with $access target flag $targetFlag only without changing the target flag',
    async ({ access, sourceFlag, targetFlag, shouldMatch }) => {
      await initializeAiAttributionFixture({
        resourcePaths: [
          '/source',
          '/target-readonly',
          '/target-writable',
          '/destination',
        ],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'same content',
            aiAttributions: {
              opaque: true,
              humanModified: sourceFlag,
            },
          }),
          target: {
            ...attributionFixture('target', {
              packageName: 'same content',
              aiAttributions: {
                opaque: true,
                humanModified: targetFlag,
              },
            }),
            needsReview: true,
          },
        },
        resourceLinks: {
          '/source': ['source'],
          '/target-readonly': ['target'],
          ...(access === 'mixed' ? { '/target-writable': ['target'] } : {}),
        },
        readonlyRules: [{ path: '/target-readonly', readonly: true }],
      });

      await mutations.createOrMatchAttributions({
        resourcePath: '/destination',
        attributions: {
          source: {
            ...attributionFixture('source', { packageName: 'same content' }),
            needsReview: true,
          },
        },
      });

      const [destinationUuid] = await linkedAttributionIds('/destination');
      expect(destinationUuid === 'target').toBe(shouldMatch);
      expect(await resourceAccessOf('target')).toBe(
        access === 'readonly' && !shouldMatch
          ? AttributionResourceAccess.Readonly
          : AttributionResourceAccess.Mixed,
      );
      expect((await readAiMetadata('target')).human_modified).toBe(
        targetFlag === undefined ? null : Number(targetFlag),
      );
    },
  );

  it.each([undefined, true])(
    'preserves target flag %s when a false source becomes true after a content edit',
    async (targetFlag) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/target'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'before',
            aiAttributions: {
              opaque: true,
              humanModified: false,
            },
          }),
          target: attributionFixture('target', {
            packageName: 'after',
            aiAttributions: {
              opaque: true,
              humanModified: targetFlag,
            },
          }),
        },
        resourceLinks: {
          '/source': ['source'],
          '/target': ['target'],
        },
      });

      await mutations.updateOrMatchAttributions({
        attributions: {
          source: attributionFixture('source', { packageName: 'after' }),
        },
      });

      expect(await linkedAttributionIds('/source')).toEqual(['target']);
      await expect(readAiMetadata('target', 'human_modified')).resolves.toEqual(
        {
          human_modified: targetFlag === undefined ? null : 1,
        },
      );
    },
  );

  it.each([undefined, false])(
    'rolls back a destination match when merging source flag %s and linking fails',
    async (sourceFlag) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/target', '/destination'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'same content',
            aiAttributions: {
              opaque: true,
              humanModified: sourceFlag,
            },
          }),
          target: {
            ...attributionFixture('target', {
              packageName: 'same content',
              aiAttributions: {
                opaque: true,
                humanModified: true,
              },
            }),
            needsReview: true,
          },
        },
        resourceLinks: {
          '/source': ['source'],
          '/target': ['target'],
        },
      });
      const { result: beforeFailure } = await getSaveFileArgs();
      await sql`
        CREATE TRIGGER reject_target_destination_link
        BEFORE INSERT ON resource_to_attribution
        WHEN NEW.attribution_uuid = 'target'
          AND (SELECT human_modified FROM attribution_ai
               WHERE attribution_uuid = 'target') IS NOT 1
        BEGIN SELECT RAISE(ABORT, 'test target destination link failure'); END
      `.execute(getDb());

      try {
        await expect(
          mutations.createOrMatchAttributions({
            resourcePath: '/destination',
            attributions: {
              source: {
                ...attributionFixture('source', {
                  packageName: 'same content',
                }),
                needsReview: true,
              },
            },
          }),
        ).rejects.toThrow('test target destination link failure');
      } finally {
        await sql`DROP TRIGGER IF EXISTS reject_target_destination_link`.execute(
          getDb(),
        );
      }

      const { result: afterFailure } = await getSaveFileArgs();
      expect(afterFailure.manualAttributions).toEqual(
        beforeFailure.manualAttributions,
      );
      expect(afterFailure.resourcesToAttributions).toEqual(
        beforeFailure.resourcesToAttributions,
      );

      await mutations.createOrMatchAttributions({
        resourcePath: '/destination',
        attributions: {
          source: {
            ...attributionFixture('source', { packageName: 'same content' }),
            needsReview: true,
          },
        },
      });
      const { result: afterRetry } = await getSaveFileArgs();
      expect(afterRetry.resourcesToAttributions).toEqual({
        ...beforeFailure.resourcesToAttributions,
        '/destination': ['target'],
      });
      expect(afterRetry.resourcesToAttributions['/source']).toEqual(['source']);
      expect(afterRetry.manualAttributions.target).toHaveProperty(
        'aiAttributions',
        {
          opaque: true,
          ...(sourceFlag === undefined ? {} : { humanModified: sourceFlag }),
        },
      );
    },
  );

  it.each([undefined, false])(
    'uses an AI target with flag %s for a resource-specific content edit',
    async (targetFlag) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/source-also', '/target'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'before',
            aiAttributions: {
              opaque: { nested: [1, true] },
            },
          }),
          target: attributionFixture('target', {
            packageName: 'after',
            aiAttributions: {
              opaque: { nested: [1, true] },
              humanModified: targetFlag,
            },
          }),
        },
        resourceLinks: {
          '/source': ['source'],
          '/source-also': ['source'],
          '/target': ['target'],
        },
      });

      await mutations.modifyOrMatchOnlyOnOneResource({
        resourcePath: '/source',
        attributions: {
          source: attributionFixture('source', { packageName: 'after' }),
        },
      });

      expect(await linkedAttributionIds('/source')).toEqual(['target']);
      expect(await linkedAttributionIds('/source-also')).toEqual(['source']);
      const { result: saved } = await getSaveFileArgs();
      expect(Object.keys(saved.manualAttributions)).toHaveLength(2);
      expect(saved.manualAttributions.target).toHaveProperty('aiAttributions', {
        opaque: { nested: [1, true] },
        ...(targetFlag === undefined ? {} : { humanModified: targetFlag }),
      });
      expect(saved.manualAttributions.source.packageName).toBe('before');
    },
  );
});
