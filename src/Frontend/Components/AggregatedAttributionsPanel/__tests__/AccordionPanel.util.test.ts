// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { PackagePanelTitle } from '../../../enums/enums';
import { getContainedManualDisplayPackageInfosWithCount } from '../AccordionPanel.util';

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
        id: 'uuid_2',
      },
      [expectedPackageCardIds[1]]: {
        count: 1,
        packageName: 'Angular',
        id: 'uuid_3',
      },
      [expectedPackageCardIds[2]]: {
        count: 1,
        packageName: 'React',
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
