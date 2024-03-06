// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: 1 },
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2)]: [
          attributionId1,
          attributionId3,
        ],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [
          attributionId1,
          attributionId2,
        ],
      }),
    }),
    outputData: faker.opossum.outputData({
      resolvedExternalAttributions: [attributionId1],
    }),
  },
});

test('deletes and restores signals', async ({
  attributionDetails,
  resourcesTree,
  signalsPanel,
}) => {
  await resourcesTree.goto(resourceName1);
  await signalsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.packageCard.assert.isHidden(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);

  await signalsPanel.packageCard.click(packageInfo3);
  await attributionDetails.deleteButton.click();
  await signalsPanel.packageCard.assert.isHidden(packageInfo3);

  await resourcesTree.goto(resourceName4);
  await signalsPanel.assert.selectedTabIs('onResource');
  await signalsPanel.packageCard.assert.isHidden(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);

  await signalsPanel.showDeletedButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);

  await signalsPanel.packageCard.click(packageInfo1);
  await attributionDetails.restoreButton.click();
  await signalsPanel.hideDeletedButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
});

test('deletes and restores multiple signals at once', async ({
  resourcesTree,
  signalsPanel,
}) => {
  await signalsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);

  await signalsPanel.packageCard.checkbox(packageInfo2).check();
  await signalsPanel.packageCard.checkbox(packageInfo3).check();
  await signalsPanel.deleteButton.click();
  await signalsPanel.packageCard.assert.isHidden(packageInfo2);
  await signalsPanel.packageCard.assert.isHidden(packageInfo3);

  await resourcesTree.goto(resourceName4);
  await signalsPanel.showDeletedButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);

  await signalsPanel.packageCard.checkbox(packageInfo1).check();
  await signalsPanel.packageCard.checkbox(packageInfo2).check();
  await signalsPanel.restoreButton.click();
  await signalsPanel.hideDeletedButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
});
