// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
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

test('cancels compare-selection mode without opening the diff popup', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.compareWithButton.click();

  await attributionDetails.assert.comparingWithTextIsVisible(
    `${manualPackageInfo1.packageName}, ${manualPackageInfo1.packageVersion}`,
  );
  // Can't compare the pinned item with itself.
  await attributionDetails.assert.compareSelectionConfirmButtonIsHidden();

  await attributionDetails.cancelButton.click();

  await attributionDetails.assert.compareWithButtonIsVisible();
  await diffPopup.assert.isHidden();
});

test('lets the user pick a compare target on another resource via compare-selection mode', async ({
  attributionDetails,
  attributionsPanel,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.compareWithButton.click();
  await attributionDetails.assert.comparingWithTextIsVisible(
    `${manualPackageInfo1.packageName}, ${manualPackageInfo1.packageVersion}`,
  );
  await attributionsPanel.packageCard.assert.isPickerSource(manualPackageInfo1);

  // Compare-selection mode survives navigating to another resource.
  await resourcesTree.goto(resourceName2);
  await attributionDetails.assert.comparingWithTextIsVisible(
    `${manualPackageInfo1.packageName}, ${manualPackageInfo1.packageVersion}`,
  );
  await attributionsPanel.packageCard.assert.isNotPickerSource(
    manualPackageInfo2,
  );

  // Preview the second resource's attribution by clicking its card, like
  // normal browsing.
  await attributionsPanel.packageCard.click(manualPackageInfo2);
  await attributionDetails.assert.compareSelectionConfirmButtonIsVisible();

  await attributionDetails.compareSelectionConfirmButton.click();
  await diffPopup.assert.isVisible();
  await diffPopup.originalAttributionForm.assert.nameIs(
    manualPackageInfo2.packageName || '',
  );
  await diffPopup.currentAttributionForm.assert.nameIs(
    manualPackageInfo1.packageName || '',
  );
  await diffPopup.assert.applyButtonIsHidden();
  await diffPopup.assert.revertAllButtonIsHidden();
  await diffPopup.assert.noDiffArrowsAreVisible();

  await diffPopup.cancelButton.click();
  await diffPopup.assert.isHidden();

  // Closing the read-only diff popup keeps compare-selection mode active
  // without changing the previewed attribution.
  await attributionDetails.assert.comparingWithTextIsVisible(
    `${manualPackageInfo1.packageName}, ${manualPackageInfo1.packageVersion}`,
  );
  await attributionDetails.assert.compareSelectionConfirmButtonIsVisible();
  await attributionDetails.attributionForm.assert.nameIs(
    manualPackageInfo2.packageName || '',
  );
});
