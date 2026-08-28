// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { getAttributions } from '../getAttributions';
import { initializeDefaultAttributionQueryTestData } from './attribution-query-test-helpers';

describe('getAttributions', () => {
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
