// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.externalAttribution();
const [attributionId2, packageInfo2] = faker.opossum.externalAttribution();

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
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [
          attributionId1,
          attributionId2,
        ],
        [faker.opossum.filePath(resourceName2)]: [attributionId2],
      }),
    }),
    outputData: faker.opossum.outputData({
      resolvedExternalAttributions: new Set([attributionId1]),
    }),
  },
});

test('hides and unhides unique signals based on user interaction', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.assert.contextMenu.buttonsAreVisible(
    'hideButton',
  );
  await resourceDetails.signalCard.assert.contextMenu.buttonsAreHidden(
    'unhideButton',
  );

  await resourceDetails.signalCard.contextMenu.hideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.assert.contextMenu.buttonsAreVisible(
    'unhideButton',
  );
  await resourceDetails.signalCard.assert.contextMenu.buttonsAreHidden(
    'hideButton',
  );

  await resourceDetails.signalCard.closeContextMenu();
  await resourceBrowser.goto(resourceName2);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.unhideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);
});
