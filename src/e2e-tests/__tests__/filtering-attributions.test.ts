// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  followUp: 'FOLLOW_UP',
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
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
      manualAttributions: faker.opossum.manualAttributions({
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

test('filters attributions and persists selection across attribution and report views', async ({
  attributionFilters,
  attributionList,
  projectStatisticsPopup,
  reportView,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await topBar.gotoAttributionView();
  await attributionList.attributionCard.assert.isVisible(packageInfo1);
  await attributionList.attributionCard.assert.isVisible(packageInfo2);
  await attributionList.attributionCard.assert.isVisible(packageInfo3);
  await attributionFilters.assert.isHidden();

  await attributionList.toggleFiltersVisibility();
  await attributionFilters.assert.isVisible();

  await attributionFilters.openFilterMenu();
  await attributionFilters.onlyFollowUpOption.click();
  await attributionFilters.closeFilterMenu();
  await attributionList.attributionCard.assert.isVisible(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
  await attributionList.attributionCard.assert.isHidden(packageInfo3);

  await topBar.gotoReportView();
  await reportView.assert.attributionIsVisible(packageInfo1);
  await reportView.assert.attributionIsHidden(packageInfo2);
  await reportView.assert.attributionIsHidden(packageInfo3);

  await attributionFilters.openFilterMenu();
  await attributionFilters.onlyFollowUpOption.click();
  await attributionFilters.closeFilterMenu();
  await reportView.assert.attributionIsVisible(packageInfo1);
  await reportView.assert.attributionIsVisible(packageInfo2);
  await reportView.assert.attributionIsVisible(packageInfo3);

  await attributionFilters.openFilterMenu();
  await attributionFilters.onlyFirstPartyOption.click();
  await attributionFilters.closeFilterMenu();
  await reportView.assert.attributionIsHidden(packageInfo1);
  await reportView.assert.attributionIsHidden(packageInfo2);
  await reportView.assert.attributionIsVisible(packageInfo3);

  await topBar.gotoAttributionView();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
  await attributionList.attributionCard.assert.isVisible(packageInfo3);
});
