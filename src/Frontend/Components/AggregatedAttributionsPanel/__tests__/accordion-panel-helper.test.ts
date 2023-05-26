// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  DisplayPackageInfosWithCount,
} from '../../../types/types';
import {
  Attributions,
  AttributionsToHashes,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../shared/shared-types';
import {
  getContainedManualDisplayPackageInfosWithCount,
  getExternalDisplayPackageInfosWithCount,
  sortDisplayPackageInfosWithCountByCountAndPackageName,
} from '../accordion-panel-helpers';
import { PanelAttributionData } from '../../../util/get-contained-packages';
import { PackagePanelTitle } from '../../../enums/enums';

describe('getExternalDisplayPackageInfosWithCount', () => {
  const testAttributionIdsWithCount: Array<AttributionIdWithCount> = [
    { attributionId: 'uuid1', count: 3 },
    { attributionId: 'uuid2', count: 2 },
  ];
  const testPackagePanelTitle = PackagePanelTitle.ContainedExternalPackages;

  it('merges attributions with same hash', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'Typescript' },
      uuid2: { packageName: 'Typescript' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };

    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        count: 5,
        displayPackageInfo: {
          attributionIds: ['uuid1', 'uuid2'],
          packageName: 'Typescript',
        },
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle
      )
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });

  it('does not merge attributions without hash', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'Typescript' },
      uuid2: { packageName: 'Typescript' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {};

    const expectedPackageCardIds = [
      `${testPackagePanelTitle}-0`,
      `${testPackagePanelTitle}-1`,
    ];
    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        count: 3,
        displayPackageInfo: {
          packageName: 'Typescript',
          attributionIds: ['uuid1'],
        },
      },
      [expectedPackageCardIds[1]]: {
        count: 2,
        displayPackageInfo: {
          packageName: 'Typescript',
          attributionIds: ['uuid2'],
        },
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle
      )
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });

  it('keeps the minimum confidence in the merged attribution', () => {
    const testAttributions: Attributions = {
      uuid1: { attributionConfidence: 20 },
      uuid2: { attributionConfidence: 80 },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };
    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        count: 5,
        displayPackageInfo: {
          attributionIds: ['uuid1', 'uuid2'],
          attributionConfidence: 20,
        },
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle
      )
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });

  it('appends comments, skipping empty ones', () => {
    const testAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
      { attributionId: 'uuid2' },
      { attributionId: 'uuid3' },
      { attributionId: 'uuid4' },
    ];
    const testAttributions: Attributions = {
      uuid1: { comment: 'comment A' },
      uuid2: { comment: 'comment B' },
      uuid3: {},
      uuid4: { comment: '' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
      uuid3: 'a',
      uuid4: 'a',
    };
    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        count: 0,
        displayPackageInfo: {
          attributionIds: ['uuid1', 'uuid2', 'uuid3', 'uuid4'],
          comments: ['comment A', 'comment B'],
        },
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle
      )
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });

  it('merges originIds, de-duplicating them', () => {
    const testAttributions: Attributions = {
      uuid1: { originIds: ['uuid3', 'uuid4'] },
      uuid2: { originIds: ['uuid3', 'uuid5'] },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };
    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        count: 5,
        displayPackageInfo: {
          attributionIds: ['uuid1', 'uuid2'],
          originIds: ['uuid3', 'uuid4', 'uuid5'],
        },
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle
      )
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });

  it('sorts ordinary and merged attributions according to the count', () => {
    const testAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      { attributionId: 'uuidToMerge1', count: 3 },
      { attributionId: 'uuidToMerge2', count: 2 },
      { attributionId: 'uuidNotToMerge', count: 1 },
    ];
    const testAttributions: Attributions = {
      uuidToMerge1: { packageName: 'Typescript' },
      uuidToMerge2: { packageName: 'Typescript' },
      uuidNotToMerge: { packageName: 'React' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuidToMerge1: 'a',
      uuidToMerge2: 'a',
    };

    const expectedPackageCardIds = [
      `${testPackagePanelTitle}-1`,
      `${testPackagePanelTitle}-0`,
    ];

    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        count: 5,
        displayPackageInfo: {
          attributionIds: ['uuidToMerge1', 'uuidToMerge2'],
          packageName: 'Typescript',
        },
      },
      [expectedPackageCardIds[1]]: {
        count: 1,
        displayPackageInfo: {
          attributionIds: ['uuidNotToMerge'],
          packageName: 'React',
        },
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle
      )
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });
});

describe('getContainedManualDisplayPackageInfosWithCount', () => {
  const testPackagePanelTitle = PackagePanelTitle.ContainedManualPackages;
  it('yields correct results', () => {
    const selectedResourceId = 'folder/';
    const testAttributions: Attributions = {
      uuid_1: {
        packageName: 'React',
      },
      uuid_2: {
        packageName: 'Vue',
      },
      uuid_3: {
        packageName: 'Angular',
      },
    };
    const testResourcesToAttributions: ResourcesToAttributions = {
      'folder/file1': ['uuid_1', 'uuid_2'],
      'folder/file2': ['uuid_2', 'uuid_3'],
    };
    const testResourcesWithAttributedChildren: ResourcesWithAttributedChildren =
      {
        paths: ['folder/', 'folder/file1', 'folder/file2'],
        pathsToIndices: { 'folder/': 0, 'folder/file1': 1, 'folder/file2': 2 },
        attributedChildren: { 0: new Set([1, 2]) },
      };
    const manualData: PanelAttributionData = {
      attributions: testAttributions,
      resourcesToAttributions: testResourcesToAttributions,
      resourcesWithAttributedChildren: testResourcesWithAttributedChildren,
    };

    const expectedPackageCardIds = [
      `${testPackagePanelTitle}-1`,
      `${testPackagePanelTitle}-2`,
      `${testPackagePanelTitle}-0`,
    ];

    const expectedDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [expectedPackageCardIds[0]]: {
        displayPackageInfo: {
          packageName: 'Vue',
          attributionIds: ['uuid_2'],
        },
        count: 2,
      },
      [expectedPackageCardIds[1]]: {
        displayPackageInfo: {
          packageName: 'Angular',
          attributionIds: ['uuid_3'],
        },
        count: 1,
      },
      [expectedPackageCardIds[2]]: {
        displayPackageInfo: {
          packageName: 'React',
          attributionIds: ['uuid_1'],
        },
        count: 1,
      },
    };

    expect(
      getContainedManualDisplayPackageInfosWithCount({
        selectedResourceId,
        manualData,
        panelTitle: testPackagePanelTitle,
      })
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfosWithCount]);
  });
});

describe('sortDisplayPackageInfosWithCountByCountAndPackageName', () => {
  it('sorts items correctly', () => {
    const initialPackageCardIds: Array<string> = [
      'pcid1',
      'pcid2',
      'pcid3',
      'pcid4',
      'pcid5',
      'pcid6',
    ];
    const testDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      pcid1: {
        displayPackageInfo: { attributionIds: ['uuid1'] },
        count: 10,
      },
      pcid2: {
        displayPackageInfo: { attributionIds: ['uuid2'], packageName: 'c' },
        count: 11,
      },
      pcid3: {
        displayPackageInfo: { attributionIds: ['uuid3'], packageName: 'b' },
        count: 10,
      },
      pcid4: {
        displayPackageInfo: { attributionIds: ['uuid4'], packageName: 'e' },
        count: 1,
      },
      pcid5: {
        displayPackageInfo: { attributionIds: ['uuid5'], packageName: 'z' },
        count: 10,
      },
      pcid6: {
        displayPackageInfo: { attributionIds: ['uuid6'], packageName: 'd' },
        count: 1,
      },
    };
    const expectedPackageCardIds: Array<string> = [
      'pcid2',
      'pcid3',
      'pcid5',
      'pcid1',
      'pcid6',
      'pcid4',
    ];

    const result = initialPackageCardIds.sort(
      sortDisplayPackageInfosWithCountByCountAndPackageName(
        testDisplayPackageInfosWithCount
      )
    );
    expect(result).toEqual(expectedPackageCardIds);
  });
});
