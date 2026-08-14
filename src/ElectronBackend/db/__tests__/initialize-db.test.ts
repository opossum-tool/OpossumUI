// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Insertable } from 'kysely';

import { Criticality } from '../../../shared/shared-types';
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import { AttributionResourceAccess } from '../../types/types';
import { getDb } from '../db';
import type { Attribution } from '../generated/databaseTypes';

describe('database initialization', () => {
  it('calculates readonly resource state from inherited split rules', async () => {
    await initializeDbWithTestData({
      resources: {
        readonly: {
          'child.ts': 1,
          writable: { 'still-readonly.ts': 1, 'writable.ts': 1 },
        },
        'also-readonly.ts': 1,
      },
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/readonly/writable', readonly: false },
        { path: '/readonly/writable/still-readonly.ts', readonly: true },
      ],
    });

    const resources = await getDb()
      .selectFrom('resource')
      .select(['path', 'is_readonly', 'has_editable_descendant'])
      .orderBy('id')
      .execute();

    expect(resources).toEqual([
      { path: '', is_readonly: 1, has_editable_descendant: 1 },
      { path: '/readonly', is_readonly: 1, has_editable_descendant: 1 },
      {
        path: '/readonly/writable',
        is_readonly: 0,
        has_editable_descendant: 1,
      },
      {
        path: '/readonly/writable/still-readonly.ts',
        is_readonly: 1,
        has_editable_descendant: 0,
      },
      {
        path: '/readonly/writable/writable.ts',
        is_readonly: 0,
        has_editable_descendant: 1,
      },
      {
        path: '/readonly/child.ts',
        is_readonly: 1,
        has_editable_descendant: 0,
      },
      {
        path: '/also-readonly.ts',
        is_readonly: 1,
        has_editable_descendant: 0,
      },
    ]);
  });

  it('uses root access for attributions without resource links', async () => {
    await initializeDbWithTestData({
      resources: {
        readonly: { 'readonly.ts': 1 },
        writable: { 'writable.ts': 1 },
      },
      manualAttributions: {
        attributions: {
          orphaned: { id: 'orphaned', criticality: Criticality.None },
          readonly: { id: 'readonly', criticality: Criticality.None },
          writable: { id: 'writable', criticality: Criticality.None },
          shared: { id: 'shared', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/readonly/readonly.ts': ['readonly', 'shared'],
          '/writable/writable.ts': ['writable', 'shared'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/writable', readonly: false },
      ],
    });

    const attributions = await getDb()
      .selectFrom('attribution')
      .select(['uuid', 'resource_access'])
      .orderBy('uuid')
      .execute();

    expect(attributions).toEqual([
      {
        uuid: 'orphaned',
        resource_access: AttributionResourceAccess.Readonly,
      },
      {
        uuid: 'readonly',
        resource_access: AttributionResourceAccess.Readonly,
      },
      { uuid: 'shared', resource_access: AttributionResourceAccess.Mixed },
      {
        uuid: 'writable',
        resource_access: AttributionResourceAccess.Writable,
      },
    ]);

    expect(
      await getDb()
        .selectFrom('resource_to_attribution')
        .select('attribution_uuid')
        .where('attribution_uuid', '=', 'orphaned')
        .execute(),
    ).toEqual([]);
  });

  it('defaults resources to writable when split metadata is absent', async () => {
    await initializeDbWithTestData({ resources: { 'file.ts': 1 } });

    expect(
      await getDb()
        .selectFrom('resource')
        .select(['path', 'is_readonly'])
        .orderBy('id')
        .execute(),
    ).toEqual([
      { path: '', is_readonly: 0 },
      { path: '/file.ts', is_readonly: 0 },
    ]);
  });

  it('enforces attribution column constraints', async () => {
    await initializeDbWithTestData();

    const invalidValues: Array<Insertable<Attribution>> = [
      { uuid: 'invalid-boolean', is_external: 2 },
      { uuid: 'invalid-resource-access', is_external: 0, resource_access: 99 },
      { uuid: 'invalid-criticality', is_external: 0, criticality: 99 },
      {
        uuid: 'invalid-confidence',
        is_external: 0,
        attribution_confidence: 101,
      },
      { uuid: 'invalid-classification', is_external: 0, classification: -1 },
      {
        uuid: 'invalid-additional-data',
        is_external: 0,
        additional_data: '[]',
      },
      { uuid: 'invalid-origin-ids', is_external: 0, origin_ids: '{}' },
      {
        uuid: 'invalid-preferred-origin-ids',
        is_external: 0,
        preferred_over_origin_ids: 'not-json',
      },
    ];

    for (const values of invalidValues) {
      await expect(
        getDb().insertInto('attribution').values(values).execute(),
      ).rejects.toThrow();
    }

    await getDb()
      .insertInto('attribution')
      .values([
        {
          uuid: 'valid-lower-boundaries',
          is_external: 0,
          attribution_confidence: 0,
          classification: 0,
          additional_data: '{}',
          origin_ids: '[]',
          preferred_over_origin_ids: '[]',
        },
        {
          uuid: 'valid-upper-confidence',
          is_external: 0,
          attribution_confidence: 100,
          additional_data: '{}',
        },
      ])
      .execute();
  });
});
