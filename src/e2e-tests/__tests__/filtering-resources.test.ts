// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [
  externalResourceName,
  preselectedResourceName,
  reviewedMitResourceName,
  reviewedApacheResourceName,
] = faker.opossum.resourceNames({ count: 4 });
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution();
const [preselectedAttributionId, preselectedPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT', preSelected: true });
const [reviewedMitAttributionId, reviewedMitPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT' });
const [reviewedApacheAttributionId, reviewedApachePackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'Apache-2.0' });

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [externalResourceName]: 1,
        [preselectedResourceName]: 1,
        [reviewedMitResourceName]: 1,
        [reviewedApacheResourceName]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(externalResourceName)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [preselectedAttributionId]: preselectedPackageInfo,
        [reviewedMitAttributionId]: reviewedMitPackageInfo,
        [reviewedApacheAttributionId]: reviewedApachePackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(preselectedResourceName)]: [
          preselectedAttributionId,
        ],
        [faker.opossum.filePath(reviewedMitResourceName)]: [
          reviewedMitAttributionId,
        ],
        [faker.opossum.filePath(reviewedApacheResourceName)]: [
          reviewedApacheAttributionId,
        ],
      }),
    }),
  },
});

test('filters the resource tree to unreviewed files', async ({
  resourcesTree,
}) => {
  await resourcesTree.filterButton.click();
  await resourcesTree.filters.unreviewed.click();
  await resourcesTree.closeMenu();

  await resourcesTree.assert.resourceIsVisible(externalResourceName);
  await resourcesTree.assert.resourceIsVisible(preselectedResourceName);
  await resourcesTree.assert.resourceIsHidden(reviewedMitResourceName);
  await resourcesTree.assert.resourceIsHidden(reviewedApacheResourceName);
});

test('combines unreviewed and license filters in the resource tree', async ({
  resourcesTree,
}) => {
  await resourcesTree.filterButton.click();
  await resourcesTree.filters.unreviewed.click();
  await resourcesTree.closeMenu();
  await resourcesTree.filterButton.click();
  await resourcesTree.selectLicenseName(preselectedPackageInfo.licenseName!);
  await resourcesTree.closeMenu();
  await resourcesTree.closeMenu();

  await resourcesTree.assert.resourceIsHidden(externalResourceName);
  await resourcesTree.assert.resourceIsVisible(preselectedResourceName);
  await resourcesTree.assert.resourceIsHidden(reviewedMitResourceName);
  await resourcesTree.assert.resourceIsHidden(reviewedApacheResourceName);
});
