// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ExternalAttributionSources,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../../shared/shared-types';
import {
  getAttributionIdsWithCountForSource,
  getSortedSources,
} from '../package-panel-helpers';
import { DisplayAttributionWithCount } from '../../../types/types';
import { convertDisplayPackageInfoToPackageInfo } from '../../../util/convert-package-info';

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

describe('PackagePanel helpers', () => {
  const testDisplayAttributionsWithCount: Array<DisplayAttributionWithCount> = [
    {
      attributionId: 'react',
      count: 5,
      attribution: {
        source: { name: 'MERGER', documentConfidence: 100 },
        packageName: 'React',
        packageVersion: '16.5.0',
        attributionIds: ['react'],
      },
    },
    {
      attributionId: 'jquery',
      attribution: {
        source: { name: 'HC', documentConfidence: 100 },
        packageName: 'JQuery',
        attributionIds: ['jquery'],
      },
    },
    {
      attributionId: 'blub',
      count: 1,
      attribution: {
        source: { name: 'HINT', documentConfidence: 10 },
        packageName: 'Blub',
        attributionIds: ['blub'],
      },
    },
    {
      attributionId: 'b_unknown',
      count: 5,
      attribution: {
        source: { name: 'a_unknown', documentConfidence: 100 },
        attributionIds: ['b_unknown'],
      },
    },
    {
      attributionId: 'vue',
      count: 500,
      attribution: {
        source: { name: 'SC', documentConfidence: 100 },
        packageName: 'Vue',
        attributionIds: ['vue'],
      },
    },
    {
      attributionId: 'a_unknown',
      count: 3,
      attribution: {
        source: { name: 'b_unknown', documentConfidence: 100 },
        attributionIds: ['a_unknown'],
      },
    },
    {
      attributionId: 'reuser',
      count: 3,
      attribution: {
        source: { name: 'REUSER:HHC', documentConfidence: 100 },
        attributionIds: ['reuser'],
      },
    },
  ];

  it('getAttributionIdsWithCountForSource returns attributionIdsWithCountForSource', () => {
    const sourceName = 'MERGER';
    const expectedAttributionIdsWithCountForSource: Array<DisplayAttributionWithCount> =
      [
        {
          attributionId: 'react',
          count: 5,
          attribution: {
            source: {
              name: 'MERGER',
              documentConfidence: 100,
            },
            packageName: 'React',
            packageVersion: '16.5.0',
            attributionIds: ['react'],
          },
        },
      ];

    expect(
      getAttributionIdsWithCountForSource(
        testDisplayAttributionsWithCount,
        sourceName
      )
    ).toEqual(expectedAttributionIdsWithCountForSource);
  });

  it('getAttributionIdsWithCountForSource returns empty array', () => {
    const sourceName = 'something';
    expect(
      getAttributionIdsWithCountForSource(
        testDisplayAttributionsWithCount,
        sourceName
      )
    ).toEqual([]);
  });

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
      getSortedSources(testDisplayAttributionsWithCount, testAttributionSources)
    ).toEqual(expectedSortedSources);
  });

  it('getSources returns empty array for no displayAttributionsWithCount,', () => {
    expect(getSortedSources([], testAttributionSources)).toEqual([]);
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
      getSortedSources(
        testDisplayAttributionsWithCount,
        testAttributionSourcesEqualPrio
      )
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

  it('convertDisplayPackageInfoToPackageInfo returns correct PackageInfo', () => {
    const testDisplayPackageInfoA: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment A', 'comment B'],
      attributionIds: ['123', '456'],
    };
    const testDisplayPackageInfoB: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment'],
      attributionIds: ['123'],
    };
    const expectedPackageInfoA: PackageInfo = {
      packageName: 'react',
    };
    const expectedPackageInfoB: PackageInfo = {
      packageName: 'react',
      comment: 'comment',
    };
    const testPackageInfoA = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfoA
    );
    const testPackageInfoB = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfoB
    );
    expect(testPackageInfoA).toEqual(expectedPackageInfoA);
    expect(testPackageInfoB).toEqual(expectedPackageInfoB);
  });
});
