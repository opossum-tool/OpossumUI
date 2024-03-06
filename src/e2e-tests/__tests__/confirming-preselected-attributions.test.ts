// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  preSelected: true,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  preSelected: true,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId1],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
      }),
    }),
  },
});

test('updates progress bar when user confirms pre-selected attributions', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
  topBar,
  confirmSavePopup,
  linkedResourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithOnlyPreSelectedAttributions: 4,
  });
  await attributionDetails.assert.confirmButtonIsVisible();
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'preselectedLabel',
  );

  await attributionsPanel.packageCard.click(packageInfo1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);

  await attributionDetails.confirmButton.click();
  await confirmSavePopup.confirmLocallyButton.click();
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsHidden(resourceName2);
  await linkedResourcesTree.assert.resourceIsHidden(resourceName3);
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 1,
    filesWithOnlyPreSelectedAttributions: 3,
  });
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'preselectedLabel',
  );

  await resourcesTree.goto(resourceName2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await linkedResourcesTree.assert.resourceIsHidden(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);

  await attributionDetails.confirmButton.click();
  await confirmSavePopup.confirmGloballyButton.click();
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 3,
    filesWithOnlyPreSelectedAttributions: 1,
  });

  await resourcesTree.goto(resourceName3);
  await attributionDetails.assert.confirmButtonIsHidden();
});

test('confirms multiple pre-selected attributions', async ({
  attributionsPanel,
  attributionDetails,
  confirmSavePopup,
}) => {
  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionDetails.assert.confirmButtonIsVisible();
  await attributionsPanel.packageCard.click(packageInfo2);
  await attributionDetails.assert.confirmButtonIsVisible();

  await attributionsPanel.packageCard.checkbox(packageInfo1).check();
  await attributionsPanel.packageCard.checkbox(packageInfo2).check();
  await attributionsPanel.confirmButton.click();
  await confirmSavePopup.assert.hasText('2 attributions');

  await confirmSavePopup.confirmGloballyButton.click();
  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionsPanel.packageCard.click(packageInfo2);
  await attributionDetails.assert.confirmButtonIsHidden();
});
