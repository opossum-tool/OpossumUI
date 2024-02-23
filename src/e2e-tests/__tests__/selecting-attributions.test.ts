// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  packageName: 'c',
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

test('allows selecting and deselecting all attributions in the active tab', async ({
  attributionsPanel,
  resourcesTree,
  confirmDeletePopup,
}) => {
  await resourcesTree.goto(resourceName4);
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo2);

  await attributionsPanel.selectAllCheckbox.click();
  await attributionsPanel.packageCard.assert.checkboxIsChecked(packageInfo2);

  await attributionsPanel.deleteButton.click();
  await confirmDeletePopup.assert.hasText('the following attribution');

  await confirmDeletePopup.cancelButton.click();
  await attributionsPanel.tabs.unrelated.click();
  await attributionsPanel.selectAllCheckbox.click();
  await attributionsPanel.packageCard.assert.checkboxIsChecked(packageInfo1);
  await attributionsPanel.packageCard.assert.checkboxIsChecked(packageInfo3);

  await attributionsPanel.deleteButton.click();
  await confirmDeletePopup.assert.hasText('the following 2 attributions');

  await confirmDeletePopup.cancelButton.click();
  await attributionsPanel.selectAllCheckbox.click();
  await attributionsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo1);
  await attributionsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo3);
});

test('allows navigating through the attributions list by keyboard', async ({
  attributionsPanel,
  attributionDetails,
  window,
}) => {
  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await window.keyboard.press('ArrowDown');
  await window.keyboard.press('ArrowDown');
  await window.keyboard.press('Enter');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo3,
  );

  await window.keyboard.press('ArrowUp');
  await window.keyboard.press('Space');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );
});
