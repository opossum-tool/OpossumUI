// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.externalAttribution();
const [attributionId2, packageInfo2] = faker.opossum.externalAttribution();
const attributionId3 = faker.opossum.attributionId();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [
          attributionId1,
          attributionId2,
          attributionId3,
        ],
        [faker.opossum.filePath(resourceName2)]: [
          attributionId1,
          attributionId2,
          attributionId3,
        ],
      }),
    }),
  },
});

test('hides and unhides merged signals based on user interaction', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.hideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.unhideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);
});
