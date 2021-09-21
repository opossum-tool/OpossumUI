// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  Attributions,
} from '../../../../shared/shared-types';
import {
  getAttributionIdsWithCountForSource,
  getSortedPrettifiedSources,
} from '../package-panel-helpers';

describe('PackagePanel helpers', () => {
  const testAttributionIds: Array<AttributionIdWithCount> = [
    { attributionId: 'jquery' },
    { attributionId: 'b_unknown', childrenWithAttributionCount: 5 },
    { attributionId: 'react', childrenWithAttributionCount: 5 },
    { attributionId: 'vue', childrenWithAttributionCount: 500 },
    { attributionId: 'a_unknown', childrenWithAttributionCount: 3 },
    { attributionId: 'reuser', childrenWithAttributionCount: 3 },
    { attributionId: 'blub', childrenWithAttributionCount: 1 },
  ];
  const testAttributions: Attributions = {
    react: {
      source: {
        name: 'MERGER',
        documentConfidence: 100,
      },
      packageName: 'React',
      packageVersion: '16.5.0',
    },
    jquery: {
      source: {
        name: 'HC',
        documentConfidence: 100,
      },
      packageName: 'JQuery',
    },
    blub: {
      source: {
        name: 'HINT',
        documentConfidence: 10,
      },
      packageName: 'Blub',
    },
    b_unknown: {
      source: {
        name: 'a_unknown',
        documentConfidence: 100,
      },
    },
    vue: {
      source: {
        name: 'SC',
        documentConfidence: 100,
      },
      packageName: 'Vue',
    },
    a_unknown: {
      source: {
        name: 'b_unknown',
        documentConfidence: 100,
      },
    },
    reuser: {
      source: {
        name: 'REUSER:HHC',
        documentConfidence: 100,
      },
    },
  };

  test('getAttributionIdsWithCountForSource returns attributionIdsWithCountForSource', () => {
    const sourceName = 'Suggested';
    const expectedAttributionIdsWithCountForSource: Array<AttributionIdWithCount> =
      [
        {
          attributionId: 'react',
          childrenWithAttributionCount: 5,
        },
      ];
    expect(
      getAttributionIdsWithCountForSource(
        testAttributionIds,
        testAttributions,
        sourceName
      )
    ).toEqual(expectedAttributionIdsWithCountForSource);
  });

  test('getAttributionIdsWithCountForSource returns empty array', () => {
    const sourceName = 'something';
    expect(
      getAttributionIdsWithCountForSource(
        testAttributionIds,
        testAttributions,
        sourceName
      )
    ).toEqual([]);
  });

  test('getSources returns sorted prettified sources', () => {
    const expectedSortedSources = [
      'Suggested',
      'High High Compute (old scan)',
      'ScanCode',
      'High Compute',
      'Hint',
      'a_unknown',
      'b_unknown',
    ];
    expect(
      getSortedPrettifiedSources(testAttributions, testAttributionIds)
    ).toEqual(expectedSortedSources);
  });

  test('getSources returns empty array for no attributionIds', () => {
    expect(getSortedPrettifiedSources(testAttributions, [])).toEqual([]);
  });

  test('getSources returns empty string for no attributions', () => {
    expect(getSortedPrettifiedSources({}, testAttributionIds)).toEqual(['']);
  });
});
