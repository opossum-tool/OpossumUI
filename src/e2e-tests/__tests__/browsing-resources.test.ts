// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
  resourceName6,
  resourceName7,
] = faker.opossum.resourceNames({ count: 7 });
const [attributionId1, packageInfo1] = faker.opossum.externalAttribution();
const [attributionId2, packageInfo2] = faker.opossum.externalAttribution();
const [attributionId3, packageInfo3] = faker.opossum.externalAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: { [resourceName3]: 1 } },
        [resourceName4]: 1,
        [resourceName5]: { [resourceName6]: { [resourceName7]: 1 } },
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.filePath(resourceName5, resourceName6, resourceName7)]: [
          attributionId3,
        ],
      }),
    }),
  },
});

test('shows expected resources as user browses through resources or clicks on progress bar', async ({
  projectStatisticsPopup,
  resourceBrowser,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.assert.resourceIsVisible(resourceName1);
  await resourceBrowser.assert.resourceIsVisible(resourceName4);
  await resourceBrowser.assert.resourceIsVisible(resourceName5);
  await resourceBrowser.assert.resourceIsHidden(resourceName2);
  await resourceBrowser.assert.resourceIsHidden(resourceName3);
  await resourceBrowser.assert.resourceIsHidden(resourceName6);
  await resourceBrowser.assert.resourceIsHidden(resourceName7);

  await resourceBrowser.goto(resourceName5);
  await resourceBrowser.assert.resourceIsVisible(resourceName6);
  await resourceBrowser.assert.resourceIsVisible(resourceName7);
  await resourceBrowser.assert.resourceIsHidden(resourceName2);
  await resourceBrowser.assert.resourceIsHidden(resourceName3);
});

test('cycles through resources as user clicks on progress bar', async ({
  projectStatisticsPopup,
  resourceDetails,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await topBar.progressBar.click();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1);
  await resourceDetails.signalCard.click(packageInfo1);

  await topBar.progressBar.click();
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.click(packageInfo2);

  await topBar.progressBar.click();
  await resourceDetails.signalCard.assert.isVisible(packageInfo3);
  await resourceDetails.signalCard.click(packageInfo3);

  await resourceDetails.signalCard.addButton(packageInfo3).click();
  await topBar.progressBar.click();
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.click(packageInfo2);

  await topBar.progressBar.click();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1);
  await resourceDetails.signalCard.click(packageInfo1);

  await topBar.progressBar.click();
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
});
