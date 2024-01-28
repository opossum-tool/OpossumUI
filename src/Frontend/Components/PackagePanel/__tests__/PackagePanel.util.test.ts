// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pick } from 'lodash';

import {
  Attributions,
  ExternalAttributionSources,
} from '../../../../shared/shared-types';
import {
  getPackageCardIdsAndDisplayPackageInfosForSource,
  getSortedSourcesFromDisplayPackageInfosWithCount,
} from '../PackagePanel.util';

const testSortedPackageCardIds = [
  'Signals-0',
  'Signals-1',
  'Signals-2',
  'Signals-3',
  'Signals-4',
  'Signals-5',
  'Signals-6',
];

const testDisplayPackageInfos: Attributions = {
  [testSortedPackageCardIds[0]]: {
    source: { name: 'MERGER', documentConfidence: 100 },
    packageName: 'React',
    packageVersion: '16.5.0',
    id: testSortedPackageCardIds[0],
    count: 5,
  },
  [testSortedPackageCardIds[1]]: {
    source: { name: 'HC', documentConfidence: 100 },
    packageName: 'JQuery',
    id: testSortedPackageCardIds[1],
    count: 1,
  },
  [testSortedPackageCardIds[2]]: {
    source: { name: 'HINT', documentConfidence: 10 },
    packageName: 'Blub',
    id: testSortedPackageCardIds[2],
    count: 1,
  },
  [testSortedPackageCardIds[3]]: {
    source: { name: 'a_unknown', documentConfidence: 100 },
    id: testSortedPackageCardIds[3],
    count: 5,
  },
  [testSortedPackageCardIds[4]]: {
    source: { name: 'SC', documentConfidence: 100 },
    packageName: 'Vue',
    id: testSortedPackageCardIds[4],
    count: 500,
  },
  [testSortedPackageCardIds[5]]: {
    source: { name: 'b_unknown', documentConfidence: 100 },
    id: testSortedPackageCardIds[5],
    count: 3,
  },
  [testSortedPackageCardIds[6]]: {
    source: { name: 'REUSER:HHC', documentConfidence: 100 },
    id: testSortedPackageCardIds[6],
    count: 3,
  },
};

describe('getPackageCardIdsAndDisplayPackageInfosForSource', () => {
  it('filters for source correctly', () => {
    const sourceName = 'MERGER';
    const expectedPackageCardIdsForSource = [testSortedPackageCardIds[0]];
    const expectedDisplayPackageInfosForSource = pick(testDisplayPackageInfos, [
      testSortedPackageCardIds[0],
    ]);

    expect(
      getPackageCardIdsAndDisplayPackageInfosForSource(
        testDisplayPackageInfos,
        testSortedPackageCardIds,
        sourceName,
      ),
    ).toEqual([
      expectedPackageCardIdsForSource,
      expectedDisplayPackageInfosForSource,
    ]);
  });

  it('returns empty array and object if no source matches', () => {
    const sourceName = 'something';
    expect(
      getPackageCardIdsAndDisplayPackageInfosForSource(
        testDisplayPackageInfos,
        testSortedPackageCardIds,
        sourceName,
      ),
    ).toEqual([[], {}]);
  });
});

describe('getSortedSourcesFromDisplayPackageInfosWithCount', () => {
  const testAttributionSources: ExternalAttributionSources = {
    MERGER: { name: 'Suggested', priority: 11 },
    HHC: { name: 'High High Compute', priority: 10 },
    MS: { name: 'Metadata Scanner', priority: 9 },
    'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 8 },
    'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 7 },
    'REUSER:SC': { name: 'ScanCode (old scan)', priority: 6 },
    'REUSER:HC': { name: 'High Compute (old scan)', priority: 5 },
    'REUSER:MERGER': { name: 'Suggested (old scan)', priority: 4 },
    SC: { name: 'ScanCode', priority: 3 },
    HC: { name: 'High Compute', priority: 2 },
    HINT: { name: 'Hint', priority: 1 },
  };
  it('getSources returns sorted sources', () => {
    const expectedSortedSources = [
      'MERGER',
      'REUSER:HHC',
      'SC',
      'HC',
      'HINT',
      'a_unknown',
      'b_unknown',
    ];
    expect(
      getSortedSourcesFromDisplayPackageInfosWithCount(
        testDisplayPackageInfos,
        testAttributionSources,
      ),
    ).toEqual(expectedSortedSources);
  });

  it('getSources returns empty array for no displayAttributionsWithCount,', () => {
    expect(
      getSortedSourcesFromDisplayPackageInfosWithCount(
        {},
        testAttributionSources,
      ),
    ).toEqual([]);
  });

  it('getSources sorts alphabetically if priority is identical', () => {
    const testAttributionSourcesEqualPrio: ExternalAttributionSources = {
      MERGER: { name: 'Suggested', priority: 1 },
      HHC: { name: 'High High Compute', priority: 1 },
      MS: { name: 'Metadata Scanner', priority: 1 },
      'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 1 },
      'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 1 },
      'REUSER:SC': { name: 'ScanCode (old scan)', priority: 1 },
      'REUSER:HC': { name: 'High Compute (old scan)', priority: 1 },
      SC: { name: 'ScanCode', priority: 1 },
      HC: { name: 'High Compute', priority: 1 },
      HINT: { name: 'Hint', priority: 1 },
    };
    expect(
      getSortedSourcesFromDisplayPackageInfosWithCount(
        testDisplayPackageInfos,
        testAttributionSourcesEqualPrio,
      ),
    ).toEqual([
      'HC', // High Compute
      'REUSER:HHC', // High High Compute (old scan)
      'HINT', // Hint
      'SC', // ScanCode
      'MERGER', // Suggested
      'a_unknown',
      'b_unknown',
    ]);
  });
});
