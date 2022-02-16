// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  computeAggregatedAttributionsFromChildren,
  getPanelData,
  PanelData,
  sortByCountAndPackageName,
} from '../resource-details-tabs-helpers';
import {
  AttributionIdWithCount,
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { PackagePanelTitle } from '../../../enums/enums';
import { EMPTY_ATTRIBUTION_DATA } from '../../../shared-constants';

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

  test('selects aggregated children and sorts correctly', () => {
    const expectedResult: Array<AttributionIdWithCount> = [
      {
        childrenWithAttributionCount: 2,
        attributionId: 'uuid_2',
      },
      {
        childrenWithAttributionCount: 1,
        attributionId: 'uuid_1',
      },
      {
        childrenWithAttributionCount: 1,
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

  test('filters resolved attributions correctly', () => {
    const expectedResult: Array<AttributionIdWithCount> = [
      {
        childrenWithAttributionCount: 2,
        attributionId: 'uuid_2',
      },
      {
        childrenWithAttributionCount: 1,
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
  test('sorts items correctly', () => {
    const initialAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      {
        attributionId: 'uuid1',
        childrenWithAttributionCount: 10,
      },
      {
        attributionId: 'uuid2',
        childrenWithAttributionCount: 11,
      },
      {
        attributionId: 'uuid3',
        childrenWithAttributionCount: 10,
      },
      {
        attributionId: 'uuid4',
        childrenWithAttributionCount: 1,
      },
      {
        attributionId: 'uuid5',
        childrenWithAttributionCount: 10,
      },
      {
        attributionId: 'uuid6',
        childrenWithAttributionCount: 1,
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
        childrenWithAttributionCount: 11,
      },
      {
        attributionId: 'uuid5',
        childrenWithAttributionCount: 10,
      },
      {
        attributionId: 'uuid3',
        childrenWithAttributionCount: 10,
      },
      {
        attributionId: 'uuid1',
        childrenWithAttributionCount: 10,
      },
      {
        attributionId: 'uuid6',
        childrenWithAttributionCount: 1,
      },
      {
        attributionId: 'uuid4',
        childrenWithAttributionCount: 1,
      },
    ];

    const result = initialAttributionIdsWithCount.sort(
      sortByCountAndPackageName(testAttributions)
    );
    expect(result).toEqual(expectedAttributionIdsWithCount);
  });
});

describe('getPanelData', () => {
  test('returns only the Signals sub-panel for a file', () => {
    const panelData: Array<PanelData> = getPanelData(
      '/file.txt',
      EMPTY_ATTRIBUTION_DATA,
      EMPTY_ATTRIBUTION_DATA,
      new Set<string>()
    );
    expect(panelData.length).toBe(1);
    expect(panelData[0].title).toBe(PackagePanelTitle.ExternalPackages);
  });

  test('returns all three sub-panels for a folder', () => {
    const panelData: Array<PanelData> = getPanelData(
      '/folder/',
      EMPTY_ATTRIBUTION_DATA,
      EMPTY_ATTRIBUTION_DATA,
      new Set<string>()
    );
    expect(panelData.length).toBe(3);
    expect(panelData[0].title).toBe(PackagePanelTitle.ExternalPackages);
    expect(panelData[1].title).toBe(
      PackagePanelTitle.ContainedExternalPackages
    );
    expect(panelData[2].title).toBe(PackagePanelTitle.ContainedManualPackages);
  });
});
