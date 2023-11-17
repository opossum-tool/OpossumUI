// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId1, packageInfo1] = faker.opossum.externalAttribution();
const [attributionId2, packageInfo2] = faker.opossum.externalAttribution();
const [attributionId3, packageInfo3] = faker.opossum.externalAttribution();
const attributionId4 = faker.opossum.attributionId();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: 1 },
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId1]: packageInfo1,
        [attributionId4]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2)]: [
          attributionId1,
          attributionId2,
          attributionId3,
        ],
      }),
    }),
  },
});

test('hides and unhides merged signals via attribution details', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  attributionDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceDetails.signalCard.click(packageInfo1);
  await attributionDetails.hideToggleButton.click();
  await resourceDetails.signalCard.assert.isHidden(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);

  await resourceDetails.signalCard.click(packageInfo1);
  await attributionDetails.hideToggleButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);
});

test('hides and unhides merged signals via context menu', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceDetails.signalCard.openContextMenu(packageInfo1);
  await resourceDetails.signalCard.contextMenu.hideButton.click();
  await resourceDetails.signalCard.assert.isHidden(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo1);
  await resourceDetails.signalCard.contextMenu.unhideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);
});
