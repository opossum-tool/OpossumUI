// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';
import { AttributionResourceAccess } from '../../types/types';
import { listAttributions } from '../listAttributions';
import { mutations } from '../mutations';

async function resourceAccessOf(attributionUuid: string) {
  return (
    await getDb()
      .selectFrom('attribution')
      .select('resource_access')
      .where('uuid', '=', attributionUuid)
      .executeTakeFirstOrThrow()
  ).resource_access;
}

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
      mutations.resolveAttributions({ attributionUuids: ['signal'] }),
    ).rejects.toThrow(/readonly/i);
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
        attributionUuids: ['shared'],
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

    const { result } = await mutations.createOrMatchAttributions({
      resourcePath: '/writable/file.ts',
      attributions: {
        new: { id: 'new', criticality: Criticality.None },
      },
    });

    const { result: attributions } = await listAttributions({
      external: false,
    });

    expect(Object.values(result.inputKeysToNewUuids)).toEqual([
      expect.any(String),
    ]);
    expect(Object.keys(attributions)).toEqual(
      Object.values(result.inputKeysToNewUuids),
    );
    expect(await resourceAccessOf(result.inputKeysToNewUuids.new)).toBe(
      AttributionResourceAccess.Writable,
    );
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

    await mutations.unlinkResourceFromAttributions({
      resourcePath: '/writable/file.ts',
      attributionUuids: ['shared'],
    });

    const { result: attributions } = await listAttributions({
      external: false,
    });

    expect(attributions).toEqual({});
    expect(await resourceAccessOf('shared')).toBe(
      AttributionResourceAccess.Readonly,
    );
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

  it('clones a mixed attribution before updating its writable partition', async () => {
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
  });

  it('returns the writable clone UUID after updating a mixed attribution', async () => {
    await initializeMixedAttribution();

    const response = await mutations.updateAttributions({
      attributions: {
        shared: {
          id: 'shared',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });

    expect(response).toMatchObject({
      result: {
        oldUuidsToNewUuids: {
          shared: expect.not.stringMatching(/^shared$/),
        },
      },
    });
  });

  it('keeps the locked relationship unchanged immediately after updating a mixed attribution', async () => {
    await initializeMixedAttribution();

    const response = await mutations.updateAttributions({
      attributions: {
        shared: {
          id: 'shared',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });
    const cloneUuid = response.result.oldUuidsToNewUuids.shared;
    const { result } = await listAttributions({
      external: false,
      resourcePathForRelationships: '/readonly/file.ts',
      includeReadonly: true,
    });

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

    await mutations.deleteAttributions({ attributionUuids: ['shared'] });

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
  });

  it('clones a mixed attribution before replacing its writable partition', async () => {
    await initializeMixedAttribution();

    await mutations.replaceAttributions({
      attributionUuidsToReplace: ['shared'],
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
  });
});

describe('bulk attribution mutations', () => {
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

    const response = await mutations.createOrMatchAttributions({
      resourcePath: '/parent/child.ts',
      attributions,
    });
    const createdAttributionUuids = Object.values(
      response.result.inputKeysToNewUuids,
    );
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
        mutations.deleteAttributions({ attributionUuids: ['readonly'] }),
    },
    {
      name: 'replacing',
      mutate: () =>
        mutations.replaceAttributions({
          attributionUuidsToReplace: ['readonly'],
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
