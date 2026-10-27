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
  attributionContent,
  attributionFixture,
  initializeAiAttributionFixture,
  linkedAttributionIds,
  readAiMetadata,
  resourceAccessOf,
} from './ai-attribution-test-helpers';

const contentFieldCases = [
  [
    'package name',
    { packageName: 'before' },
    { packageName: 'after' },
    'package_name',
    'after',
  ],
  [
    'package version',
    { packageVersion: '1' },
    { packageVersion: '2' },
    'package_version',
    '2',
  ],
  [
    'package namespace',
    { packageNamespace: 'before' },
    { packageNamespace: 'after' },
    'package_namespace',
    'after',
  ],
  [
    'package PURL qualifier',
    { packagePURLAppendix: '?classifier=sources' },
    { packagePURLAppendix: '?classifier=javadoc' },
    'package_purl_appendix',
    '?classifier=javadoc',
  ],
  [
    'package PURL subpath',
    { packagePURLAppendix: '#/before' },
    { packagePURLAppendix: '#/after' },
    'package_purl_appendix',
    '#/after',
  ],
  [
    'added package PURL appendix',
    {},
    { packagePURLAppendix: '?arch=x86_64' },
    'package_purl_appendix',
    '?arch=x86_64',
  ],
  [
    'removed package PURL appendix',
    { packagePURLAppendix: '?arch=x86_64' },
    {},
    'package_purl_appendix',
    null,
  ],
  [
    'package type',
    { packageType: 'npm' },
    { packageType: 'maven' },
    'package_type',
    'maven',
  ],
  [
    'URL',
    { url: 'https://before.example' },
    { url: 'https://after.example' },
    'url',
    'https://after.example',
  ],
  [
    'copyright',
    { copyright: 'before' },
    { copyright: 'after' },
    'copyright',
    'after',
  ],
  [
    'license name',
    { licenseName: 'MIT' },
    { licenseName: 'BSD-3-Clause' },
    'license_name',
    'BSD-3-Clause',
  ],
  [
    'license text',
    { licenseText: 'before' },
    { licenseText: 'after' },
    'license_text',
    'after',
  ],
  ['comment', { comment: 'before' }, { comment: 'after' }, 'comment', 'after'],
  [
    'first-party status',
    { firstParty: false },
    { firstParty: true },
    'first_party',
    1,
  ],
] as const;

describe('AI attribution modifications', () => {
  it.each([
    {
      name: 'empty text remains equivalent to missing text',
      before: {},
      after: { comment: '' },
      humanModified: null,
    },
    {
      name: 'first-party license changes are ignored',
      before: { firstParty: true, licenseName: 'MIT' },
      after: { firstParty: true, licenseName: 'GPL-3.0' },
      humanModified: null,
    },
    {
      name: 'changing first-party status counts as an edit',
      before: { firstParty: true },
      after: { firstParty: false },
      humanModified: 1,
    },
  ])('$name', async ({ before, after, humanModified }) => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/a'],
      attributions: {
        ai: attributionFixture('ai', { ...before, aiAttributions: {} }),
      },
      resourceLinks: { '/a': ['ai'] },
    });

    await mutations.updateAttributions({
      attributions: {
        ai: attributionFixture('ai', { ...after }),
      },
    });

    await expect(readAiMetadata('ai', 'human_modified')).resolves.toEqual({
      human_modified: humanModified,
    });
  });

  it.each([
    {
      property: 'attributionConfidence' as const,
      value: 0.9,
      column: 'attribution_confidence',
      persisted: 0.9,
    },
    {
      property: 'followUp' as const,
      value: true,
      column: 'follow_up',
      persisted: 1,
    },
    {
      property: 'needsReview' as const,
      value: true,
      column: 'needs_review',
      persisted: 1,
    },
    {
      property: 'preSelected' as const,
      value: true,
      column: 'pre_selected',
      persisted: 1,
    },
  ])(
    'updates the auditing field $property without marking content edited',
    async ({ property, value, column, persisted }) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/a'],
        attributions: {
          ai: attributionFixture('ai', {
            packageName: 'unchanged',
            aiAttributions: { model: 'kept', humanModified: false },
          }),
        },
        resourceLinks: { '/a': ['ai'] },
      });
      await mutations.updateAttributions({
        attributions: {
          ai: attributionFixture('ai', {
            packageName: 'unchanged',
            [property]: value,
          }),
        },
      });
      const content = await attributionContent('ai');
      expect(content.package_name).toBe('unchanged');
      expect(content).toHaveProperty(column, persisted);
      await expect(readAiMetadata('ai')).resolves.toEqual({
        additional_data: '{"model":"kept"}',
        human_modified: 0,
      });
    },
  );

  it('updates a bulk property on every selected attribution without marking content edited', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/a'],
      attributions: {
        first: attributionFixture('first', {
          aiAttributions: { model: 'a', humanModified: false },
        }),
        second: attributionFixture('second', {
          aiAttributions: { model: 'b', humanModified: false },
        }),
      },
      resourceLinks: { '/a': ['first', 'second'] },
    });
    await mutations.updateAttributionProperty({
      selection: { mode: 'explicit', attributionUuids: ['first', 'second'] },
      property: 'needsReview',
      value: true,
    });
    expect((await attributionContent('first')).needs_review).toBe(1);
    expect((await attributionContent('second')).needs_review).toBe(1);
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select(['attribution_uuid', 'human_modified'])
        .orderBy('attribution_uuid')
        .execute(),
    ).resolves.toEqual([
      { attribution_uuid: 'first', human_modified: 0 },
      { attribution_uuid: 'second', human_modified: 0 },
    ]);
  });

  it('updates a focused content edit alongside the bulk property update', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/a'],
      attributions: {
        bulkOnly: attributionFixture('bulkOnly', {
          packageName: 'same',
          aiAttributions: { model: 'bulk', humanModified: false },
        }),
        focused: attributionFixture('focused', {
          packageName: 'before',
          packagePURLAppendix: '?classifier=sources#/src',
          aiAttributions: { model: 'focused', humanModified: false },
        }),
        ordinary: attributionFixture('ordinary', { packageName: 'ordinary' }),
      },
      resourceLinks: { '/a': ['bulkOnly', 'focused', 'ordinary'] },
    });
    await mutations.updateAttributionProperty({
      selection: {
        mode: 'explicit',
        attributionUuids: ['bulkOnly', 'focused', 'ordinary'],
      },
      property: 'needsReview',
      value: true,
      attributions: {
        focused: attributionFixture('focused', { packageName: 'after' }),
      },
      focusedAttributionUuid: 'focused',
    });
    expect((await attributionContent('focused')).package_name).toBe('after');
    expect((await attributionContent('focused')).needs_review).toBe(1);
    expect((await attributionContent('bulkOnly')).needs_review).toBe(1);
    expect((await attributionContent('ordinary')).needs_review).toBe(1);
    await expect(readAiMetadata('bulkOnly', 'human_modified')).resolves.toEqual(
      { human_modified: 0 },
    );
    expect((await readAiMetadata('focused')).human_modified).toBe(1);
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .selectAll()
        .where('attribution_uuid', '=', 'ordinary')
        .execute(),
    ).resolves.toEqual([]);
  });

  it.each(contentFieldCases)(
    'marks changed %s content as human modified',
    async (_name, before, after, column, expectedValue) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/a'],
        attributions: {
          ai: attributionFixture('ai', {
            ...before,
            aiAttributions: { model: 'kept', humanModified: false },
          }),
        },
        resourceLinks: { '/a': ['ai'] },
      });
      const beforeContent = await attributionContent('ai');
      await mutations.updateAttributions({
        attributions: {
          ai: attributionFixture('ai', { ...after }),
        },
      });
      const afterContent = await attributionContent('ai');
      expect(afterContent).not.toEqual(beforeContent);
      expect(afterContent).toHaveProperty(column, expectedValue);
      const { result } = await getSaveFileArgs();
      expect(result.manualAttributions.ai).toMatchObject({
        ...after,
        aiAttributions: { model: 'kept', humanModified: true },
      });
    },
  );

  it.each([undefined, false, true])(
    'preserves humanModified=%s when all content fields are resubmitted unchanged',
    async (humanModified) => {
      const content = {
        packageName: 'name',
        packageVersion: '1.0',
        packageNamespace: 'namespace',
        packageType: 'npm',
        packagePURLAppendix: '?arch=x86_64#/src',
        url: 'https://example.com',
        copyright: 'copyright',
        licenseName: 'MIT',
        licenseText: 'license text',
        comment: 'comment',
        firstParty: false,
      };
      await initializeAiAttributionFixture({
        resourcePaths: ['/a'],
        attributions: {
          ai: attributionFixture('ai', {
            ...content,
            aiAttributions: { model: 'kept', humanModified },
          }),
        },
        resourceLinks: { '/a': ['ai'] },
      });
      await mutations.updateAttributions({
        attributions: {
          ai: attributionFixture('ai', content),
        },
      });

      expect(await readAiMetadata('ai')).toEqual({
        additional_data: '{"model":"kept"}',
        human_modified:
          humanModified === undefined ? null : Number(humanModified),
      });
    },
  );

  it('updates an ordinary attribution appendix without creating AI metadata', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/a'],
      attributions: {
        ordinary: attributionFixture('ordinary', {
          packagePURLAppendix: '?classifier=sources',
        }),
      },
      resourceLinks: { '/a': ['ordinary'] },
    });

    await mutations.updateAttributions({
      attributions: {
        ordinary: attributionFixture('ordinary', {
          packagePURLAppendix: '?classifier=javadoc',
        }),
      },
    });

    expect((await attributionContent('ordinary')).package_purl_appendix).toBe(
      '?classifier=javadoc',
    );
    const { result } = await getSaveFileArgs();
    expect(result.manualAttributions.ordinary).not.toHaveProperty(
      'aiAttributions',
    );
  });

  it('marks only the edited writable clone of a mixed attribution', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/first', '/second'],
      attributions: {
        shared: attributionFixture('shared', {
          packageName: 'before',
          packagePURLAppendix: '?classifier=sources#/src',
          aiAttributions: { origin: 'test' },
        }),
      },
      resourceLinks: {
        '/first': ['shared'],
        '/second': ['shared'],
      },
      readonlyRules: [{ path: '/second', readonly: true }],
    });

    await mutations.modifyOrMatchOnlyOnOneResource({
      resourcePath: '/first',
      attributions: {
        shared: attributionFixture('shared', {
          packageName: 'before',
          packagePURLAppendix: '?classifier=javadoc#/src',
        }),
      },
    });

    const editedUuid = (await linkedAttributionIds('/first'))[0];
    expect(editedUuid).not.toBe('shared');
    expect(await linkedAttributionIds('/second')).toEqual(['shared']);
    expect((await attributionContent(editedUuid)).package_purl_appendix).toBe(
      '?classifier=javadoc#/src',
    );
    expect((await attributionContent('shared')).package_purl_appendix).toBe(
      '?classifier=sources#/src',
    );
    await expect(
      getDb()
        .selectFrom('attribution_ai')
        .select(['attribution_uuid', 'human_modified'])
        .where('attribution_uuid', 'in', ['shared', editedUuid])
        .orderBy('attribution_uuid')
        .execute(),
    ).resolves.toEqual(
      expect.arrayContaining([
        { attribution_uuid: editedUuid, human_modified: 1 },
        { attribution_uuid: 'shared', human_modified: null },
      ]),
    );
  });

  it.each([undefined, false, true])(
    'keeps the human modified flag after reverting an edit starting with %s',
    async (humanModified) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/a'],
        attributions: {
          ai: attributionFixture('ai', {
            packageName: 'original',
            aiAttributions: { humanModified },
          }),
          ordinary: attributionFixture('ordinary', { packageName: 'original' }),
        },
        resourceLinks: { '/a': ['ai', 'ordinary'] },
      });

      for (const packageName of ['edited', 'original']) {
        await mutations.updateAttributions({
          attributions: {
            ai: attributionFixture('ai', { packageName }),
            ordinary: attributionFixture('ordinary', { packageName }),
          },
        });
        await expect(readAiMetadata('ai', 'human_modified')).resolves.toEqual({
          human_modified: 1,
        });
        expect((await attributionContent('ordinary')).package_name).toBe(
          packageName,
        );
      }

      await expect(
        getDb()
          .selectFrom('attribution_ai')
          .selectAll()
          .where('attribution_uuid', '=', 'ordinary')
          .execute(),
      ).resolves.toEqual([]);
    },
  );

  it('rolls back an attribution edit when marking its AI row fails', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/a'],
      attributions: {
        ai: attributionFixture('ai', {
          packageName: 'before',
          aiAttributions: { humanModified: false },
        }),
      },
      resourceLinks: { '/a': ['ai'] },
    });
    await sql`
        CREATE TRIGGER reject_human_modified
        BEFORE UPDATE OF human_modified ON attribution_ai
        BEGIN
          SELECT RAISE(ABORT, 'test flag update failure');
        END
      `.execute(getDb());

    const originalLinks = await linkedAttributionIds('/a');
    try {
      await expect(
        mutations.updateAttributions({
          attributions: {
            ai: attributionFixture('ai', { packageName: 'after' }),
          },
        }),
      ).rejects.toThrow('test flag update failure');
    } finally {
      await sql`DROP TRIGGER IF EXISTS reject_human_modified`.execute(getDb());
    }
    expect(await linkedAttributionIds('/a')).toEqual(originalLinks);
    expect((await attributionContent('ai')).package_name).toBe('before');
    await expect(readAiMetadata('ai', 'human_modified')).resolves.toEqual({
      human_modified: 0,
    });
    await mutations.updateAttributions({
      attributions: {
        ai: attributionFixture('ai', { packageName: 'after' }),
      },
    });
    expect((await attributionContent('ai')).package_name).toBe('after');
  });

  it.each([
    {
      name: 'omitted flag, same content',
      humanModified: undefined,
      editContent: false,
      expected: null,
    },
    {
      name: 'false flag, same content',
      humanModified: false,
      editContent: false,
      expected: 0,
    },
    {
      name: 'true flag, same content',
      humanModified: true,
      editContent: false,
      expected: 1,
    },
    {
      name: 'omitted flag, changed content',
      humanModified: undefined,
      editContent: true,
      expected: 1,
    },
    {
      name: 'false flag, changed content',
      humanModified: false,
      editContent: true,
      expected: 1,
    },
    {
      name: 'true flag, changed content',
      humanModified: true,
      editContent: true,
      expected: 1,
    },
  ])(
    'copies manual AI metadata for $name',
    async ({ humanModified, editContent, expected }) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/copy'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'original',
            aiAttributions: {
              opaque: { nested: [1, true] },
              humanModified,
            },
          }),
        },
        resourceLinks: { '/source': ['source'] },
      });
      await mutations.createOrMatchAttributions({
        resourcePath: '/copy',
        attributions: {
          copy: attributionFixture('source', {
            packageName: editContent ? 'edited' : 'original',
            needsReview: true,
          }),
        },
      });
      const copyLinks = await linkedAttributionIds('/copy');
      expect(copyLinks).toHaveLength(1);
      const [copyUuid] = copyLinks;
      expect(copyUuid).not.toBe('source');
      expect((await attributionContent(copyUuid)).package_name).toBe(
        editContent ? 'edited' : 'original',
      );
      expect((await attributionContent('source')).package_name).toBe(
        'original',
      );
      await expect(readAiMetadata(copyUuid)).resolves.toEqual({
        additional_data: '{"opaque":{"nested":[1,true]}}',
        human_modified: expected,
      });
      await expect(readAiMetadata('source')).resolves.toEqual({
        additional_data: '{"opaque":{"nested":[1,true]}}',
        human_modified:
          humanModified === undefined ? null : Number(humanModified),
      });
    },
  );

  it.each([undefined, false, true])(
    'preserves mixed attribution metadata for an auditing edit with humanModified=%s',
    async (humanModified) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/readonly', '/writable'],
        attributions: {
          shared: attributionFixture('shared', {
            packageName: 'original',
            aiAttributions: {
              opaque: { nested: [1, true] },
              humanModified,
            },
          }),
        },
        resourceLinks: {
          '/readonly': ['shared'],
          '/writable': ['shared'],
        },
        readonlyRules: [{ path: '/readonly', readonly: true }],
      });
      await mutations.updateAttributions({
        attributions: {
          shared: attributionFixture('shared', {
            packageName: 'original',
            needsReview: true,
          }),
        },
      });
      const [cloneUuid] = await linkedAttributionIds('/writable');
      expect(cloneUuid).not.toBe('shared');
      expect(await linkedAttributionIds('/readonly')).toEqual(['shared']);
      expect(await resourceAccessOf('shared')).toBe(
        AttributionResourceAccess.Readonly,
      );
      expect(await resourceAccessOf(cloneUuid)).toBe(
        AttributionResourceAccess.Writable,
      );
      for (const uuid of ['shared', cloneUuid]) {
        await expect(readAiMetadata(uuid)).resolves.toEqual({
          additional_data: '{"opaque":{"nested":[1,true]}}',
          human_modified:
            humanModified === undefined ? null : Number(humanModified),
        });
      }
    },
  );

  it('creates a separate manual copy when the target has different AI metadata', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/source', '/target', '/copy'],
      attributions: {
        source: attributionFixture('source', {
          packageName: 'source',
          aiAttributions: { origin: 'source', humanModified: true },
        }),
        target: attributionFixture('target', {
          packageName: 'target',
          aiAttributions: { origin: 'target', humanModified: false },
        }),
      },
      resourceLinks: {
        '/source': ['source'],
        '/target': ['target'],
      },
    });
    await mutations.createOrMatchAttributions({
      resourcePath: '/copy',
      attributions: {
        copy: attributionFixture('source', { packageName: 'target' }),
      },
    });
    const copyUuids = await linkedAttributionIds('/copy');
    expect(copyUuids).toHaveLength(1);
    const [copyUuid] = copyUuids;
    expect(copyUuid).not.toBe('source');
    expect(copyUuid).not.toBe('target');
    const { result: saved } = await getSaveFileArgs();
    expect(saved.manualAttributions[copyUuid]).toMatchObject({
      packageName: 'target',
      aiAttributions: { origin: 'source', humanModified: true },
    });
    expect(saved.manualAttributions.source).toMatchObject({
      packageName: 'source',
      aiAttributions: { origin: 'source', humanModified: true },
    });
    expect(saved.resourcesToAttributions['/source']).toEqual(['source']);
    expect(saved.resourcesToAttributions['/target']).toEqual(['target']);
    expect(Object.keys(saved.manualAttributions)).toHaveLength(3);
    await expect(readAiMetadata('target')).resolves.toEqual({
      additional_data: '{"origin":"target"}',
      human_modified: 0,
    });
  });

  it('rolls back a new attribution when copying AI metadata fails', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/source', '/copy'],
      attributions: {
        source: attributionFixture('source', {
          packageName: 'source',
          aiAttributions: { opaque: true },
        }),
      },
      resourceLinks: { '/source': ['source'] },
    });
    await sql`
        CREATE TRIGGER reject_ai_copy BEFORE INSERT ON attribution_ai
        BEGIN SELECT RAISE(ABORT, 'test AI copy failure'); END
      `.execute(getDb());
    const originalLinks = await linkedAttributionIds('/source');
    try {
      await expect(
        mutations.createOrMatchAttributions({
          resourcePath: '/copy',
          attributions: {
            copy: attributionFixture('source', { packageName: 'edited' }),
          },
        }),
      ).rejects.toThrow('test AI copy failure');
    } finally {
      await sql`DROP TRIGGER IF EXISTS reject_ai_copy`.execute(getDb());
    }
    expect(await linkedAttributionIds('/source')).toEqual(originalLinks);
    expect(await linkedAttributionIds('/copy')).toEqual([]);
    await expect(
      getDb().selectFrom('attribution').select('uuid').execute(),
    ).resolves.toEqual([{ uuid: 'source' }]);
    await expect(
      getDb().selectFrom('attribution_ai').selectAll().execute(),
    ).resolves.toEqual([
      {
        attribution_uuid: 'source',
        additional_data: '{"opaque":true}',
        deferred_fields: null,
        human_modified: null,
      },
    ]);
    await mutations.createOrMatchAttributions({
      resourcePath: '/copy',
      attributions: {
        copy: attributionFixture('source', { packageName: 'edited' }),
      },
    });
    expect(await linkedAttributionIds('/copy')).toHaveLength(1);
  });

  it('creates an edited manual copy without AI metadata when its source has none', async () => {
    await initializeAiAttributionFixture({
      resourcePaths: ['/source', '/copy'],
      attributions: {
        source: attributionFixture('source', { packageName: 'original' }),
      },
      resourceLinks: { '/source': ['source'] },
    });
    await mutations.createOrMatchAttributions({
      resourcePath: '/copy',
      attributions: {
        copy: attributionFixture('source', { packageName: 'edited' }),
      },
    });
    const [copyUuid] = await linkedAttributionIds('/copy');
    expect(copyUuid).not.toBe('source');
    await expect(
      getDb().selectFrom('attribution_ai').selectAll().execute(),
    ).resolves.toEqual([]);
  });
});
