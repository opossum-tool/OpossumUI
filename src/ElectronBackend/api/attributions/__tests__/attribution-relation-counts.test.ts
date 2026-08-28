// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { listAttributionRelationCounts } from '../attribution-relation-counts';
import {
  initializeDefaultAttributionQueryTestData,
  relationCounts,
} from './attribution-query-test-helpers';

describe('listAttributionRelationCounts', () => {
  beforeEach(async () => {
    await initializeDefaultAttributionQueryTestData();
  });

  it('returns relation counts independently of page hydration', async () => {
    const counts = await relationCounts({
      external: false,
      resourcePathForRelationships: '/parent/resource',
    });

    expect(counts.result).toEqual({
      resource: { visibleCount: 2, editableCount: 2 },
      unrelated: { visibleCount: 3, editableCount: 3 },
    });
  });

  it('counts related readonly attributions as visible but not editable', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/parent/readonly/one.ts',
        '/parent/readonly/two.ts',
        '/parent/writable.ts',
      ]),
      manualAttributions: {
        attributions: {
          relatedReadonlyOne: {
            id: 'relatedReadonlyOne',
            criticality: Criticality.None,
          },
          relatedReadonlyTwo: {
            id: 'relatedReadonlyTwo',
            criticality: Criticality.None,
          },
          writable: { id: 'writable', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/readonly/one.ts': ['relatedReadonlyOne'],
          '/parent/readonly/two.ts': ['relatedReadonlyTwo'],
          '/parent/writable.ts': ['writable'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [{ path: '/parent/readonly', readonly: true }],
    });

    const counts = await listAttributionRelationCounts({
      external: false,
      filters: [],
      search: '',
      valueFilters: {},
      resourcePathForRelationships: '/parent',
      showResolved: false,
      excludeUnrelated: false,
    });

    expect(counts.result.children).toEqual({
      visibleCount: 3,
      editableCount: 1,
    });
  });
});
