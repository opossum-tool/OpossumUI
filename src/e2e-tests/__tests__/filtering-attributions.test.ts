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
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  firstParty: true,
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
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
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

test('filters attributions in audit view', async ({ attributionsPanel }) => {
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);

  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.needsFollowUp.click();
  await attributionsPanel.closeMenu();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo3);

  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.firstParty.click();
  await attributionsPanel.closeMenu();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo3);

  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.needsFollowUp.click();
  await attributionsPanel.closeMenu();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);

  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.firstParty.click();
  await attributionsPanel.closeMenu();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);

  await attributionsPanel.filterButton.click();
  await attributionsPanel.selectLicenseName(packageInfo1.licenseName!);
  await attributionsPanel.closeMenu();
  await attributionsPanel.closeMenu();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo3);
});

test('filters attributions in report view', async ({ reportView, topBar }) => {
  await topBar.gotoReportView();
  await reportView.assert.attributionIsVisible(attributionId1);
  await reportView.assert.attributionIsVisible(attributionId2);
  await reportView.assert.attributionIsVisible(attributionId3);

  await reportView.filterButton.click();
  await reportView.filters.needsFollowUp.click();
  await reportView.closeMenu();
  await reportView.assert.attributionIsVisible(attributionId1);
  await reportView.assert.attributionIsHidden(attributionId2);
  await reportView.assert.attributionIsHidden(attributionId3);

  await reportView.filterButton.click();
  await reportView.filters.firstParty.click();
  await reportView.closeMenu();
  await reportView.assert.attributionIsHidden(attributionId1);
  await reportView.assert.attributionIsHidden(attributionId2);
  await reportView.assert.attributionIsHidden(attributionId3);

  await reportView.filterButton.click();
  await reportView.filters.needsFollowUp.click();
  await reportView.closeMenu();
  await reportView.assert.attributionIsHidden(attributionId1);
  await reportView.assert.attributionIsHidden(attributionId2);
  await reportView.assert.attributionIsVisible(attributionId3);

  await reportView.filterButton.click();
  await reportView.filters.firstParty.click();
  await reportView.closeMenu();
  await reportView.assert.attributionIsVisible(attributionId1);
  await reportView.assert.attributionIsVisible(attributionId2);
  await reportView.assert.attributionIsVisible(attributionId3);

  await reportView.filterButton.click();
  await reportView.selectLicenseName(packageInfo1.licenseName!);
  await reportView.closeMenu();
  await reportView.closeMenu();
  await reportView.assert.attributionIsVisible(attributionId1);
  await reportView.assert.attributionIsHidden(attributionId2);
  await reportView.assert.attributionIsHidden(attributionId3);
});

test('only displays attributions matching search term', async ({
  attributionsPanel,
}) => {
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);

  await attributionsPanel.searchField.fill(packageInfo1.packageName!);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo3);

  await attributionsPanel.clearSearchButton.click();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);
});
