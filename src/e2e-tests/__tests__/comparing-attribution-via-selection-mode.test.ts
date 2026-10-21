// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { parseOpossumFile } from '../../ElectronBackend/input/parseFile';
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId1, manualPackageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, manualPackageInfo2] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: manualPackageInfo1,
        [attributionId2]: manualPackageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId2],
      }),
    }),
  },
});

test('keeps both drafts when save confirmation is cancelled and persists the reopened save', async ({
  attributionDetails,
  attributionsPanel,
  confirmSavePopup,
  diffPopup,
  filePaths,
  menuBar,
  resourcesTree,
}) => {
  const firstLeftPackageName = 'cancelled-left-edit';
  const firstRightPackageName = 'cancelled-right-edit';
  const finalLeftPackageName = 'reopened-left-edit';
  const finalRightPackageName = 'reopened-right-edit';

  await resourcesTree.goto(resourceName1);
  await attributionDetails.compareWithButton.click();
  await resourcesTree.goto(resourceName2);
  await attributionsPanel.packageCard.click(manualPackageInfo2);
  await attributionDetails.compareSelectionConfirmButton.click();
  await diffPopup.assert.isVisible();

  await diffPopup.leftPackageName.fill(firstLeftPackageName);
  await diffPopup.rightPackageName.fill(firstRightPackageName);
  await diffPopup.saveButton.click();
  await confirmSavePopup.assert.isVisible();
  await confirmSavePopup.cancelButton.click();
  await confirmSavePopup.assert.isHidden();
  await diffPopup.assert.isVisible();
  await diffPopup.assert.leftPackageNameIs(firstLeftPackageName);
  await diffPopup.assert.rightPackageNameIs(firstRightPackageName);

  await diffPopup.leftPackageName.fill(finalLeftPackageName);
  await diffPopup.rightPackageName.fill(finalRightPackageName);
  await diffPopup.saveButton.click();
  await confirmSavePopup.assert.isVisible();
  await confirmSavePopup.saveGloballyButton.click();
  await confirmSavePopup.assert.isHidden();
  await diffPopup.assert.isHidden();

  await menuBar.saveChanges();
  await expect
    .poll(async () => {
      const parsed = await parseOpossumFile(filePaths!.opossum);
      return 'input' in parsed ? parsed.output : null;
    })
    .toEqual(
      expect.objectContaining({
        manualAttributions: expect.objectContaining({
          [attributionId1]: expect.objectContaining({
            packageName: finalLeftPackageName,
          }),
          [attributionId2]: expect.objectContaining({
            packageName: finalRightPackageName,
          }),
        }),
      }),
    );

  await resourcesTree.goto(resourceName1);
  await attributionsPanel.packageCard.click({
    ...manualPackageInfo1,
    packageName: finalLeftPackageName,
  });
  await attributionDetails.attributionForm.assert.nameIs(finalLeftPackageName);
  await resourcesTree.goto(resourceName2);
  await attributionsPanel.packageCard.click({
    ...manualPackageInfo2,
    packageName: finalRightPackageName,
  });
  await attributionDetails.attributionForm.assert.nameIs(finalRightPackageName);
});
