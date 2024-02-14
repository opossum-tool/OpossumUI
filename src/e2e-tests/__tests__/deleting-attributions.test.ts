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
] = faker.opossum.resourceNames({ count: 5 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
        [resourceName3]: 1,
        [resourceName4]: 1,
        [resourceName5]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [
          attributionId1,
          attributionId3,
        ],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId1],
        [faker.opossum.filePath(resourceName4)]: [
          attributionId2,
          attributionId3,
        ],
        [faker.opossum.filePath(resourceName5)]: [attributionId2],
      }),
    }),
  },
});

test('deletes single attributions and updates progress bar', async ({
  attributionDetails,
  attributionsPanel,
  confirmDeletionPopup,
  resourcesTree,
  topBar,
  linkedResourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionsPanel.packageCard.click(packageInfo3);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo3,
  );
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 5,
  });

  await attributionDetails.deleteButton.click();
  await confirmDeletionPopup.assert.isVisible();

  await confirmDeletionPopup.deleteGloballyButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 5,
  });

  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.assert.tabIsVisible('unrelated');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);

  await attributionDetails.deleteButton.click();
  await confirmDeletionPopup.deleteLocallyButton.click();
  await attributionsPanel.assert.selectedTabIs('unrelated');
  await attributionsPanel.assert.tabIsHidden('onResource');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionDetails.attributionForm.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 4,
  });

  await resourcesTree.goto(resourceName2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await linkedResourcesTree.assert.resourceIsHidden(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);
  await attributionDetails.deleteButton.click();
  await confirmDeletionPopup.deleteGloballyButton.click();
  await attributionsPanel.assert.selectedTabIs('unrelated');
  await attributionsPanel.assert.tabIsHidden('onResource');
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 2,
  });

  await resourcesTree.goto(resourceName3);
  await attributionDetails.attributionForm.assert.isEmpty();
  await attributionDetails.assert.deleteButtonIsHidden();

  await attributionsPanel.packageCard.click(packageInfo2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );
  await attributionDetails.assert.deleteButtonIsVisible();

  await attributionDetails.deleteButton.click();
  await confirmDeletionPopup.deleteGloballyButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 0,
  });
});

test('deletes multiple attributions at once', async ({
  attributionDetails,
  attributionsPanel,
  confirmDeletionPopup,
}) => {
  await attributionsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo1);
  await attributionsPanel.packageCard.assert.checkboxIsUnchecked(packageInfo2);

  await attributionsPanel.packageCard.checkbox(packageInfo1).check();
  await attributionsPanel.packageCard.checkbox(packageInfo2).check();
  await attributionsPanel.packageCard.assert.checkboxIsChecked(packageInfo1);
  await attributionsPanel.packageCard.assert.checkboxIsChecked(packageInfo2);

  await attributionsPanel.deleteButton.click();
  await confirmDeletionPopup.assert.hasText('2 attributions');

  await confirmDeletionPopup.deleteGloballyButton.click();
  await confirmDeletionPopup.assert.isHidden();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionDetails.attributionForm.assert.isEmpty();
});
