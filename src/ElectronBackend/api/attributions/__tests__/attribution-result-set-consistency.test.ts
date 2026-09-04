// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { getDb } from '../../../db/db';
import {
  getAttributionSelectionSummary,
  resolveAttributionSelection,
} from '../attribution-selection-queries';
import {
  allPage,
  defaultCriteria,
  initializeDefaultAttributionQueryTestData,
  listPage,
  locate,
  preview,
  relationCounts,
} from './attribution-query-test-helpers';

describe('attribution result-set consistency', () => {
  beforeEach(async () => {
    await initializeDefaultAttributionQueryTestData();
  });

  it('summarizes a query-wide selection with exclusions', async () => {
    const summary = await getAttributionSelectionSummary({
      selection: {
        mode: 'allMatching',
        query: {
          external: false,
          filters: [],
          search: '',
          valueFilters: {},
          resourcePathForRelationships: '/parent/resource',
          showResolved: false,
          excludeUnrelated: false,
          relation: 'resource',
        },
        excludedAttributionUuids: ['resourceOne'],
      },
    });

    expect(summary.result).toMatchObject({
      selectedCount: 1,
      writableLinkedResourceCount: 2,
      allLinkedToSelectedResource: true,
    });
  });

  it('keeps page, counts, resolution, preview, and navigation on one result set', async () => {
    const criteria = {
      ...defaultCriteria,
      filters: ['thirdParty' as const],
      search: 'resource',
      resourcePathForRelationships: '/parent/resource',
      showResolved: false,
      excludeUnrelated: true,
    };
    const page = await listPage({
      ...criteria,
      scope: { mode: 'relation', relation: 'resource' },
      sort: 'alphabetically',
      includeReadonly: false,
      offset: 0,
      limit: 200,
    });
    const counts = await relationCounts(criteria);
    const selection = {
      mode: 'allMatching' as const,
      query: { ...criteria, relation: 'resource' as const },
      excludedAttributionUuids: [],
    };
    const resolved = await getDb()
      .transaction()
      .execute((trx) => resolveAttributionSelection(trx, selection));
    const summary = await getAttributionSelectionSummary({ selection });
    const previewResult = await preview({
      ...selection.query,
      excludedAttributionUuids: ['resourceOne'],
      offset: 0,
      limit: 200,
    });
    const navigation = await locate({
      ...criteria,
      targetAttributionUuid: 'resourceTwo',
    });

    expect(Object.keys(page.result.attributions)).toEqual([
      'resourceOne',
      'resourceTwo',
    ]);
    expect(counts.result.resource).toMatchObject({
      visibleCount: 2,
      editableCount: 2,
    });
    expect(resolved).toEqual(['resourceOne', 'resourceTwo']);
    expect(summary.result.selectedCount).toBe(2);
    expect(Object.keys(previewResult.result.attributions)).toEqual([
      'resourceTwo',
    ]);
    expect(navigation.result).toMatchObject({
      found: true,
      targetRelation: 'resource',
    });
  });

  it('preserves the complete readonly visibility matrix in the all scope', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources([
        '/parent/readonly/file.ts',
        '/parent/writable/file.ts',
        '/other/readonly/file.ts',
      ]),
      manualAttributions: {
        attributions: {
          unlinked: { id: 'unlinked', criticality: Criticality.None },
          readonly: { id: 'readonly', criticality: Criticality.None },
          relatedReadonly: {
            id: 'relatedReadonly',
            criticality: Criticality.None,
          },
          unrelatedReadonly: {
            id: 'unrelatedReadonly',
            criticality: Criticality.None,
          },
          writable: { id: 'writable', criticality: Criticality.None },
          mixed: { id: 'mixed', criticality: Criticality.None },
        },
        resourcesToAttributions: {
          '/parent/readonly/file.ts': ['readonly', 'relatedReadonly', 'mixed'],
          '/parent/writable/file.ts': ['writable', 'mixed'],
          '/other/readonly/file.ts': ['unrelatedReadonly'],
        },
        attributionsToResources: {},
      },
      readonlyRules: [
        { path: '/parent/readonly', readonly: true },
        { path: '/other/readonly', readonly: true },
      ],
    });

    const defaultPage = await allPage({
      external: false,
      resourcePathForRelationships: '',
    });
    expect(Object.keys(defaultPage.result.attributions)).toEqual(
      expect.arrayContaining(['mixed', 'unlinked', 'writable']),
    );
    expect(Object.keys(defaultPage.result.attributions)).toHaveLength(3);
    expect(Object.keys(defaultPage.result.attributions)).not.toContain(
      'readonly',
    );
    expect(Object.keys(defaultPage.result.attributions)).not.toContain(
      'relatedReadonly',
    );

    const relatedPage = await allPage({
      external: false,
      resourcePathForRelationships: '/parent',
      includeReadonly: true,
    });
    expect(relatedPage.result.attributions.relatedReadonly).toMatchObject({
      resourceAccess: 'readonly',
      relation: 'children',
    });
    expect(relatedPage.result.attributions.writable).toMatchObject({
      resourceAccess: 'writable',
      relation: 'children',
    });
    expect(relatedPage.result.attributions.unrelatedReadonly).toBeUndefined();

    const readonlyResourcePage = await allPage({
      external: false,
      resourcePathForRelationships: '/parent/readonly/file.ts',
      includeReadonly: true,
      excludeUnrelated: true,
    });
    expect(readonlyResourcePage.result.attributions.readonly).toBeDefined();
    expect(readonlyResourcePage.result.attributions.writable).toBeUndefined();
  });
});
