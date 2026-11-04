// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { getAttributionPreview, getAttributions } from '../getAttributions';
import {
  initializeDefaultAttributionQueryTestData,
  preview,
} from './attribution-query-test-helpers';

describe('getAttributions', () => {
  it('counts editable links across the project without changing scoped counts', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/branch/file', '/outside', '/readonly']),
      manualAttributions: {
        attributions: Object.fromEntries(
          ['a', 'b', 'empty', 'readonly'].map((id) => [
            id,
            { id, packageName: id, criticality: Criticality.None },
          ]),
        ),
        resourcesToAttributions: {
          '/branch/file': ['a', 'b'],
          '/outside': ['a'],
          '/readonly': ['a', 'readonly'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });
    const params = {
      attributionUuids: ['a', 'b', 'empty', 'readonly'],
      resourcePathForRelationships: '/branch/',
    };
    const scoped = await getAttributions(params);
    expect(scoped.result.a.count).toBe(1);
    expect(scoped.result.a.writableLinkedResourceCount).toBeUndefined();

    const counted = await getAttributionPreview(params);
    expect(counted.result.a).toMatchObject({
      count: 1,
      writableLinkedResourceCount: 2,
    });
    expect(counted.result.b.writableLinkedResourceCount).toBe(1);
    expect(counted.result.empty.writableLinkedResourceCount).toBe(0);
    expect(counted.result.readonly.writableLinkedResourceCount).toBe(0);

    const unscoped = await getAttributionPreview({
      attributionUuids: ['a'],
    });
    expect(unscoped.result.a.writableLinkedResourceCount).toBe(2);
    expect(unscoped.result.a.count).toBeUndefined();

    const page = {
      resourcePathForRelationships: '/branch/',
      relation: 'children' as const,
      limit: 1,
    };
    const first = await preview({ ...page, offset: 0 });
    const second = await preview({ ...page, offset: 1 });
    expect(Object.keys(first.result.attributions)).toEqual(['a']);
    expect(first.result.attributions.a).toMatchObject({
      count: 1,
      writableLinkedResourceCount: 2,
    });
    expect(Object.keys(second.result.attributions)).toEqual(['b']);
    expect(second.result.attributions.b.writableLinkedResourceCount).toBe(1);
  });

  beforeEach(async () => {
    await initializeDefaultAttributionQueryTestData();
  });

  it('loads an explicit UUID batch without applying result-set filters', async () => {
    const result = await getAttributions({
      attributionUuids: ['missing', 'unrelated', 'resourceOne', 'unrelated'],
      resourcePathForRelationships: '/parent/resource',
    });

    expect(Object.keys(result.result)).toEqual(['unrelated', 'resourceOne']);
    expect(result.result.resourceOne.relation).toBe('resource');
    expect(result.result.unrelated.relation).toBe('unrelated');
  });

  it('hydrates explicit UUID batches without calculating relationships when omitted', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/readonly/file.ts']),
      manualAttributions: {
        attributions: {
          readonly: { id: 'readonly', criticality: Criticality.None },
        },
        resourcesToAttributions: { '/readonly/file.ts': ['readonly'] },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/readonly', readonly: true }],
    });

    const result = await getAttributions({
      attributionUuids: ['readonly'],
    });

    expect(result.result.readonly).toMatchObject({
      resourceAccess: 'readonly',
    });
    expect(result.result.readonly.relation).toBeUndefined();
  });
});
