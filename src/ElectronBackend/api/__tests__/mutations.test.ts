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
import { listAttributionsPage } from '../listAttributionsPage';
import {
  type AttributionCacheImpact,
  MAX_TARGETED_CACHE_UUIDS,
  mutations,
} from '../mutations';

async function resourceAccessOf(attributionUuid: string) {
  return (
    await getDb()
      .selectFrom('attribution')
      .select('resource_access')
      .where('uuid', '=', attributionUuid)
      .executeTakeFirstOrThrow()
  ).resource_access;
}

function expectExactAffectedAttributionUuids(
  response: {
    affectedAttributionUuids?: Array<string>;
    attributionCacheImpact?: AttributionCacheImpact;
  },
  expected: Array<string>,
) {
  const actual = affectedAttributionUuidsOf(response);
  expect(actual).toHaveLength(new Set(actual).size);
  expect([...actual].sort()).toEqual([...expected].sort());
}

function affectedAttributionUuidsOf(response: {
  affectedAttributionUuids?: Array<string>;
  attributionCacheImpact?: AttributionCacheImpact;
}) {
  return response.attributionCacheImpact?.mode === 'targeted'
    ? response.attributionCacheImpact.attributionUuids
    : (response.affectedAttributionUuids ?? []);
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
    expectExactAffectedAttributionUuids(response, [createdAttributionUuid]);
    expect(await resourceAccessOf(createdAttributionUuid)).toBe(
      AttributionResourceAccess.Writable,
    );
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

    const response = await mutations.unlinkResourceFromAttributions({
      resourcePath: '/writable/file.ts',
      attributionUuids: ['shared'],
    });

    expectExactAffectedAttributionUuids(response, ['shared']);

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

    const cloneUuid = (
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('package_name', '=', 'updated')
        .executeTakeFirstOrThrow()
    ).uuid;
    expect(cloneUuid).not.toBe('shared');
    expectExactAffectedAttributionUuids(response, ['shared', cloneUuid]);
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

    const response = await mutations.deleteAttributions({
      attributionUuids: ['shared'],
    });

    const cloneUuids = affectedAttributionUuidsOf(response).filter(
      (uuid) => uuid !== 'shared',
    );
    expect(cloneUuids).toHaveLength(1);
    expectExactAffectedAttributionUuids(response, ['shared', cloneUuids[0]]);

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

    const response = await mutations.replaceAttributions({
      attributionUuidsToReplace: ['shared'],
      attributionUuidToReplaceWith: 'replacement',
    });

    const generatedCloneUuids = affectedAttributionUuidsOf(response).filter(
      (uuid) => uuid !== 'shared' && uuid !== 'replacement',
    );
    expect(generatedCloneUuids).toHaveLength(1);
    expectExactAffectedAttributionUuids(response, [
      'shared',
      'replacement',
      generatedCloneUuids[0],
    ]);

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

    const response = await mutations.replaceAttributions({
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
    expectExactAffectedAttributionUuids(response, [
      'first',
      'second',
      'replacement',
    ]);
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

    const response = await mutations.updateAttributionProperty({
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
    expectExactAffectedAttributionUuids(response, ['first']);
    expect(response).not.toHaveProperty('affectedAttributionUuids');
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

  it('bounds targeted cache impact independently of explicit selection mode', async () => {
    const attributionUuids = Array.from(
      { length: MAX_TARGETED_CACHE_UUIDS + 1 },
      (_, index) => `attribution-${index}`,
    );
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: Object.fromEntries(
          attributionUuids.map((attributionUuid) => [
            attributionUuid,
            { id: attributionUuid, criticality: Criticality.None },
          ]),
        ),
        resourcesToAttributions: {
          '/parent/child.ts': attributionUuids,
        },
        attributionsToResources: {},
      },
    });

    const targetedResponse = await mutations.updateAttributionProperty({
      selection: {
        mode: 'explicit',
        attributionUuids: attributionUuids.slice(0, MAX_TARGETED_CACHE_UUIDS),
      },
      property: 'needsReview',
      value: true,
    });
    expect(targetedResponse.attributionCacheImpact).toMatchObject({
      mode: 'targeted',
      attributionUuids: expect.any(Array),
    });
    const targetedImpact = targetedResponse.attributionCacheImpact;
    if (targetedImpact.mode !== 'targeted') {
      throw new Error('Expected targeted cache impact');
    }
    expect(targetedImpact.attributionUuids).toHaveLength(
      MAX_TARGETED_CACHE_UUIDS,
    );

    const broadResponse = await mutations.updateAttributionProperty({
      selection: { mode: 'explicit', attributionUuids },
      property: 'followUp',
      value: true,
    });
    expect(broadResponse.attributionCacheImpact).toEqual({ mode: 'broad' });
    expect(
      broadResponse.invalidates.filter(
        (invalidation) => invalidation.queryName === 'getAttributionData',
      ),
    ).toEqual([{ queryName: 'getAttributionData' }]);
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

    const focused = await getDb()
      .selectFrom('attribution')
      .select(['package_name', 'pre_selected'])
      .where('uuid', '=', 'focused')
      .executeTakeFirstOrThrow();

    expect(focused).toEqual({ package_name: 'after', pre_selected: 0 });
  });

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
    expectExactAffectedAttributionUuids(response, [
      'existing',
      ...createdAttributionUuids,
    ]);
  });
});

describe('attribution mutation metadata', () => {
  it('reports inherited attributions reclassified by a local link', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          parent: { id: 'parent', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/parent': ['parent'] },
        attributionsToResources: {},
      },
    });

    const response = await mutations.createOrMatchAttributions({
      resourcePath: '/parent/child.ts',
      attributions: {
        local: {
          id: 'local',
          criticality: Criticality.None,
          packageName: 'local',
        },
      },
    });
    const localUuid = (
      await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .where('package_name', '=', 'local')
        .executeTakeFirstOrThrow()
    ).uuid;

    expectExactAffectedAttributionUuids(response, ['parent', localUuid]);
  });

  it('reports inherited attributions revealed by a local unlink', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          parent: { id: 'parent', criticality: Criticality.None },
          local: { id: 'local', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent': ['parent'],
          '/parent/child.ts': ['local'],
        },
        attributionsToResources: {},
      },
    });

    const response = await mutations.unlinkResourceFromAttributions({
      resourcePath: '/parent/child.ts',
      attributionUuids: ['local'],
    });

    expectExactAffectedAttributionUuids(response, ['local', 'parent']);
  });

  it('reports inherited attributions revealed by deleting a local link', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/parent/child.ts']),
      manualAttributions: {
        attributions: {
          parent: { id: 'parent', criticality: Criticality.None },
          local: { id: 'local', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent': ['parent'],
          '/parent/child.ts': ['local'],
        },
        attributionsToResources: {},
      },
    });

    const response = await mutations.deleteAttributions({
      attributionUuids: ['local'],
    });

    expectExactAffectedAttributionUuids(response, ['local', 'parent']);
  });

  it('reports an ordinary update exactly once', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      manualAttributions: {
        attributions: {
          original: { id: 'original', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/writable/file.ts': ['original'] },
        attributionsToResources: {},
      },
    });

    const response = await mutations.updateAttributions({
      attributions: {
        original: {
          id: 'original',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });

    expectExactAffectedAttributionUuids(response, ['original']);
  });

  it('reports an ordinary delete exactly once', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      manualAttributions: {
        attributions: {
          original: { id: 'original', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/writable/file.ts': ['original'] },
        attributionsToResources: {},
      },
    });

    const response = await mutations.deleteAttributions({
      attributionUuids: ['original'],
    });

    expectExactAffectedAttributionUuids(response, ['original']);
  });

  it('reports an ordinary replacement exactly once', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      manualAttributions: {
        attributions: {
          original: { id: 'original', criticality: Criticality.None },
          replacement: { id: 'replacement', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/writable/file.ts': ['original'] },
        attributionsToResources: {},
      },
    });

    const response = await mutations.replaceAttributions({
      attributionUuidsToReplace: ['original'],
      attributionUuidToReplaceWith: 'replacement',
    });

    expectExactAffectedAttributionUuids(response, ['original', 'replacement']);
  });

  it('reports both update-or-match branches exactly', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      manualAttributions: {
        attributions: {
          original: { id: 'original', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/writable/file.ts': ['original'] },
        attributionsToResources: {},
      },
    });

    const updateResponse = await mutations.updateOrMatchAttributions({
      attributions: {
        original: {
          id: 'original',
          criticality: Criticality.None,
          packageName: 'updated',
        },
      },
    });
    expectExactAffectedAttributionUuids(updateResponse, ['original']);

    await initializeDbWithTestData({
      resources: pathsToResources(['/writable/file.ts']),
      manualAttributions: {
        attributions: {
          original: { id: 'original', criticality: Criticality.None },
          replacement: {
            id: 'replacement',
            criticality: Criticality.None,
            packageName: 'target',
          },
        },
        resourcesToAttributions: { '/writable/file.ts': ['original'] },
        attributionsToResources: {},
      },
    });

    const matchResponse = await mutations.updateOrMatchAttributions({
      attributions: {
        original: {
          id: 'original',
          criticality: Criticality.None,
          packageName: 'target',
        },
      },
    });
    expectExactAffectedAttributionUuids(matchResponse, [
      'original',
      'replacement',
    ]);
  });

  it('reports modify-or-match UUIDs exactly', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/first', '/first/second']),
      manualAttributions: {
        attributions: {
          original: { id: 'original', criticality: Criticality.None },
          replacement: {
            id: 'replacement',
            criticality: Criticality.None,
            packageName: 'target',
          },
        },
        resourcesToAttributions: {
          '/first': ['original'],
          '/first/second': ['original'],
        },
        attributionsToResources: {},
      },
    });

    const response = await mutations.modifyOrMatchOnlyOnOneResource({
      resourcePath: '/first/second',
      attributions: {
        original: {
          id: 'original',
          criticality: Criticality.None,
          packageName: 'target',
        },
      },
    });

    expectExactAffectedAttributionUuids(response, ['original', 'replacement']);
  });

  it('reports redundant-link cleanup UUIDs exactly', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/first', '/first/second']),
      manualAttributions: {
        attributions: {
          first: { id: 'first', criticality: Criticality.None },
          second: { id: 'second', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/first': ['second'],
          '/first/second': ['first', 'second'],
        },
        attributionsToResources: {},
      },
    });

    const response = await mutations.unlinkResourceFromAttributions({
      resourcePath: '/first/second',
      attributionUuids: ['first'],
    });

    expectExactAffectedAttributionUuids(response, ['first', 'second']);
  });

  it('reports resolve and unresolve UUIDs exactly', async () => {
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

    const resolveResponse = await mutations.resolveAttributions({
      attributionUuids: ['signal'],
    });
    expectExactAffectedAttributionUuids(resolveResponse, ['signal']);

    const unresolveResponse = await mutations.unresolveAttributions({
      attributionUuids: ['signal'],
    });
    expectExactAffectedAttributionUuids(unresolveResponse, ['signal']);
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
