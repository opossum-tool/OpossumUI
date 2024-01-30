// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PackagePanelTitle } from '../../../enums/enums';
import { AttributionIdWithCount } from '../../../types/types';
import {
  getContainedManualDisplayPackageInfosWithCount,
  getExternalDisplayPackageInfosWithCount,
} from '../AccordionPanel.util';

describe('getExternalDisplayPackageInfosWithCount', () => {
  const testAttributionIdsWithCount: Array<AttributionIdWithCount> = [
    { attributionId: 'uuid1', count: 3 },
    { attributionId: 'uuid2', count: 2 },
  ];
  const testPackagePanelTitle = PackagePanelTitle.ContainedExternalPackages;

  it('merges attributions with same hash', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'Typescript', id: 'uuid1' },
      uuid2: { packageName: 'Typescript', id: 'uuid2' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };

    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        linkedAttributionIds: ['uuid1', 'uuid2'],
        packageName: 'Typescript',
        count: 3,
        id: 'uuid1',
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle,
        text.sortings.name,
      ),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });

  it('does not merge attributions without hash', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'Typescript', id: 'uuid1' },
      uuid2: { packageName: 'Typescript', id: 'uuid2' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {};

    const expectedPackageCardIds = [
      `${testPackagePanelTitle}-0`,
      `${testPackagePanelTitle}-1`,
    ];
    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        count: 3,
        packageName: 'Typescript',
        id: 'uuid1',
        linkedAttributionIds: ['uuid1'],
      },
      [expectedPackageCardIds[1]]: {
        count: 2,
        packageName: 'Typescript',
        id: 'uuid2',
        linkedAttributionIds: ['uuid2'],
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle,
        text.sortings.name,
      ),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });

  it('keeps the minimum confidence in the merged attribution', () => {
    const testAttributions: Attributions = {
      uuid1: { attributionConfidence: 20, id: 'uuid1' },
      uuid2: { attributionConfidence: 80, id: 'uuid2' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };
    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        count: 3,
        linkedAttributionIds: ['uuid1', 'uuid2'],
        attributionConfidence: 20,
        id: 'uuid1',
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle,
        text.sortings.name,
      ),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });

  it('appends comments, skipping empty ones', () => {
    const testAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
      { attributionId: 'uuid2' },
      { attributionId: 'uuid3' },
      { attributionId: 'uuid4' },
    ];
    const testAttributions: Attributions = {
      uuid1: { comments: ['comment A'], id: 'uuid1' },
      uuid2: { comments: ['comment B'], id: 'uuid2' },
      uuid3: { id: 'uuid3' },
      uuid4: { comments: [''], id: 'uuid4' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
      uuid3: 'a',
      uuid4: 'a',
    };
    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        count: 0,
        linkedAttributionIds: ['uuid1', 'uuid2', 'uuid3', 'uuid4'],
        comments: ['comment A', 'comment B'],
        id: 'uuid1',
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle,
        text.sortings.name,
      ),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });

  it('merges originIds, de-duplicating them', () => {
    const testAttributions: Attributions = {
      uuid1: { originIds: ['uuid3', 'uuid4'], id: 'uuid1' },
      uuid2: { originIds: ['uuid3', 'uuid5'], id: 'uuid2' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };
    const expectedPackageCardIds = [`${testPackagePanelTitle}-0`];
    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        count: 3,
        linkedAttributionIds: ['uuid1', 'uuid2'],
        originIds: ['uuid3', 'uuid4', 'uuid5'],
        id: 'uuid1',
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle,
        text.sortings.name,
      ),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });

  it('sorts ordinary and merged attributions according to the count', () => {
    const testAttributionIdsWithCount: Array<AttributionIdWithCount> = [
      { attributionId: 'uuidToMerge1', count: 3 },
      { attributionId: 'uuidToMerge2', count: 2 },
      { attributionId: 'uuidNotToMerge', count: 1 },
    ];
    const testAttributions: Attributions = {
      uuidToMerge1: { packageName: 'Typescript', id: 'uuidToMerge1' },
      uuidToMerge2: { packageName: 'Typescript', id: 'uuidToMerge2' },
      uuidNotToMerge: { packageName: 'React', id: 'uuidNotToMerge' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuidToMerge1: 'a',
      uuidToMerge2: 'a',
    };

    const expectedPackageCardIds = [
      `${testPackagePanelTitle}-1`,
      `${testPackagePanelTitle}-0`,
    ];

    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        count: 3,
        linkedAttributionIds: ['uuidToMerge1', 'uuidToMerge2'],
        packageName: 'Typescript',
        id: 'uuidToMerge1',
      },
      [expectedPackageCardIds[1]]: {
        count: 1,
        linkedAttributionIds: ['uuidNotToMerge'],
        packageName: 'React',
        id: 'uuidNotToMerge',
      },
    };

    expect(
      getExternalDisplayPackageInfosWithCount(
        testAttributionIdsWithCount,
        testAttributions,
        testExternalAttributionsToHashes,
        testPackagePanelTitle,
        text.sortings.occurrence,
      ),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });
});

describe('getContainedManualDisplayPackageInfosWithCount', () => {
  const testPackagePanelTitle = PackagePanelTitle.ContainedManualPackages;
  it('yields correct results', () => {
    const selectedResourceId = 'folder/';
    const testAttributions: Attributions = {
      uuid_1: {
        packageName: 'React',
        id: 'uuid_1',
      },
      uuid_2: {
        packageName: 'Vue',
        id: 'uuid_2',
      },
      uuid_3: {
        packageName: 'Angular',
        id: 'uuid_3',
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
    const manualData: AttributionData = faker.opossum.manualAttributionData({
      attributions: testAttributions,
      resourcesToAttributions: testResourcesToAttributions,
      resourcesWithAttributedChildren: testResourcesWithAttributedChildren,
    });

    const expectedPackageCardIds = [
      `${testPackagePanelTitle}-1`,
      `${testPackagePanelTitle}-2`,
      `${testPackagePanelTitle}-0`,
    ];

    const expectedDisplayPackageInfos: Attributions = {
      [expectedPackageCardIds[0]]: {
        count: 2,
        packageName: 'Vue',
        linkedAttributionIds: ['uuid_2'],
        id: 'uuid_2',
      },
      [expectedPackageCardIds[1]]: {
        count: 1,
        packageName: 'Angular',
        linkedAttributionIds: ['uuid_3'],
        id: 'uuid_3',
      },
      [expectedPackageCardIds[2]]: {
        count: 1,
        packageName: 'React',
        linkedAttributionIds: ['uuid_1'],
        id: 'uuid_1',
      },
    };

    expect(
      getContainedManualDisplayPackageInfosWithCount({
        selectedResourceId,
        manualData,
        panelTitle: testPackagePanelTitle,
        sorting: text.sortings.occurrence,
      }),
    ).toEqual([expectedPackageCardIds, expectedDisplayPackageInfos]);
  });
});
