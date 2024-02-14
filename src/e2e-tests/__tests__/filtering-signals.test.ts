// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  followUp: 'FOLLOW_UP',
  wasPreferred: true,
  preSelected: true,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  preSelected: true,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  firstParty: true,
  preSelected: true,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: {
            [resourceName3]: 1,
          },
        },
        [resourceName4]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.folderPath(resourceName1, resourceName2)]: [
          attributionId3,
        ],
      }),
    }),
  },
});

test('filters signals', async ({ signalsPanel }) => {
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);

  await signalsPanel.filterButton.click();
  await signalsPanel.filters.previouslyPreferred.click();
  await signalsPanel.closeMenu();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isHidden(packageInfo2);
  await signalsPanel.packageCard.assert.isHidden(packageInfo3);

  await signalsPanel.filterButton.click();
  await signalsPanel.filters.firstParty.click();
  await signalsPanel.closeMenu();
  await signalsPanel.packageCard.assert.isHidden(packageInfo1);
  await signalsPanel.packageCard.assert.isHidden(packageInfo2);
  await signalsPanel.packageCard.assert.isHidden(packageInfo3);

  await signalsPanel.filterButton.click();
  await signalsPanel.filters.previouslyPreferred.click();
  await signalsPanel.closeMenu();
  await signalsPanel.packageCard.assert.isHidden(packageInfo1);
  await signalsPanel.packageCard.assert.isHidden(packageInfo2);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);

  await signalsPanel.filterButton.click();
  await signalsPanel.filters.firstParty.click();
  await signalsPanel.closeMenu();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);

  await signalsPanel.filterButton.click();
  await signalsPanel.selectLicenseName(packageInfo1.licenseName!);
  await signalsPanel.closeMenu();
  await signalsPanel.closeMenu();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isHidden(packageInfo2);
  await signalsPanel.packageCard.assert.isHidden(packageInfo3);
});

test('only displays signals matching search term', async ({ signalsPanel }) => {
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);

  await signalsPanel.searchField.fill(packageInfo1.packageName!);
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isHidden(packageInfo2);
  await signalsPanel.packageCard.assert.isHidden(packageInfo3);

  await signalsPanel.clearSearchButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);
});
