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

test('allows selecting and deselecting all signals in the active tab', async ({
  signalsPanel,
}) => {
  await signalsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo1);
  await signalsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo2);
  await signalsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo3);

  await signalsPanel.selectAllCheckbox.click();
  await signalsPanel.packageCard.assert.checkboxIsChecked(packageInfo1);
  await signalsPanel.packageCard.assert.checkboxIsChecked(packageInfo2);
  await signalsPanel.packageCard.assert.checkboxIsChecked(packageInfo3);

  await signalsPanel.selectAllCheckbox.click();
  await signalsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo1);
  await signalsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo2);
  await signalsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo3);
});

test('allows navigating through the signals list by keyboard', async ({
  signalsPanel,
  attributionDetails,
  window,
}) => {
  await signalsPanel.packageCard.click(packageInfo1);
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
