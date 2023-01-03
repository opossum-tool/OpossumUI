// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  Attributions,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import {
  computeAggregatedAttributionsFromChildren,
  sortByCountAndPackageName,
} from '../get-contained-packages';

describe('computeAggregatedAttributionsFromChildren', () => {
  const testAttributions: Attributions = {
    uuid_1: { packageName: 'test Package', licenseText: 'test license text' },
    uuid_2: { packageName: 'second test Package' },
    uuid_3: { comment: 'test comment', copyright: 'test copyright' },
    uuid_4: { packageName: 'test Package' },
  };
  const testResourcesToAttributions: ResourcesToAttributions = {
    'samplepath/subfolder': ['uuid_1', 'uuid_2'],
    'samplepath2/subfolder/subsubfolder': ['uuid_3', 'uuid_2'],
    'samplepath3/subfolder': ['uuid_4'],
  };
  const testAttributedChildren: Set<string> = new Set<string>()
    .add('samplepath/subfolder')
    .add('samplepath2/subfolder/subsubfolder');

  it('selects aggregated children and sorts correctly', () => {
    const expectedResult: Array<AttributionIdWithCount> = [
      {
        count: 2,
        attributionId: 'uuid_2',
      },
      {
        count: 1,
        attributionId: 'uuid_1',
      },
      {
        count: 1,
        attributionId: 'uuid_3',
      },
    ];

    const result: Array<AttributionIdWithCount> =
      computeAggregatedAttributionsFromChildren(
        testAttributions,
        testResourcesToAttributions,
        testAttributedChildren
      );
    expect(result).toEqual(expectedResult);
  });

  it('filters resolved attributions correctly', () => {
    const expectedResult: Array<AttributionIdWithCount> = [
      {
        count: 2,
        attributionId: 'uuid_2',
      },
      {
        count: 1,
        attributionId: 'uuid_3',
      },
    ];

    const testResolvedExternalAttributions = new Set<string>();
    testResolvedExternalAttributions.add('uuid_1');

    const result: Array<AttributionIdWithCount> =
      computeAggregatedAttributionsFromChildren(
        testAttributions,
        testResourcesToAttributions,
        testAttributedChildren,
        testResolvedExternalAttributions
      );
    expect(result).toEqual(expectedResult);
  });
});

describe('sortByCountAndPackageName', () => {
  it('sorts items correctly', () => {
    const initialAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      {
        attributionId: 'uuid1',
        count: 10,
      },
      {
        attributionId: 'uuid2',
        count: 11,
      },
      {
        attributionId: 'uuid3',
        count: 10,
      },
      {
        attributionId: 'uuid4',
        count: 1,
      },
      {
        attributionId: 'uuid5',
        count: 10,
      },
      {
        attributionId: 'uuid6',
        count: 1,
      },
    ];
    const testAttributions: Attributions = {
      uuid1: {},
      uuid2: {
        packageName: 'c',
      },
      uuid3: {
        packageName: 'b',
      },
      uuid4: {
        packageName: 'e',
      },
      uuid5: {
        packageName: 'Ä',
      },
      uuid6: {
        packageName: 'd',
      },
    };
    const expectedAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      {
        attributionId: 'uuid2',
        count: 11,
      },
      {
        attributionId: 'uuid5',
        count: 10,
      },
      {
        attributionId: 'uuid3',
        count: 10,
      },
      {
        attributionId: 'uuid1',
        count: 10,
      },
      {
        attributionId: 'uuid6',
        count: 1,
      },
      {
        attributionId: 'uuid4',
        count: 1,
      },
    ];

    const result = initialAttributionIdsWithCount.sort(
      sortByCountAndPackageName(testAttributions)
    );
    expect(result).toEqual(expectedAttributionIdsWithCount);
  });
});
