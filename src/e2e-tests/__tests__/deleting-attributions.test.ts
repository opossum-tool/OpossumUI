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

test('deletes single attributions', async ({
  attributionDetails,
  attributionList,
  confirmationPopup,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.attributionCard.click(packageInfo3);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo3,
  );
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithAttributions: 5,
  });

  await attributionDetails.selectDeleteMenuOption('deleteGlobally');
  await attributionDetails.deleteGloballyButton.click();
  await confirmationPopup.assert.isVisible();

  await confirmationPopup.confirm();
  await attributionDetails.attributionForm.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithAttributions: 5,
  });

  await resourceDetails.attributionCard.click(packageInfo1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await attributionDetails.deleteButton.click();
  await confirmationPopup.confirm();
  await attributionDetails.attributionForm.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithAttributions: 4,
  });

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.selectDeleteMenuOption('deleteGlobally');
  await attributionDetails.deleteGloballyButton.click();
  await confirmationPopup.confirm();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithAttributions: 2,
  });

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.attributionForm.assert.isEmpty();
  await attributionDetails.assert.deleteButtonIsHidden();
  await attributionDetails.assert.deleteGloballyButtonIsHidden();

  await resourceBrowser.assert.isHidden();

  await attributionList.attributionCard.click(packageInfo2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );
  await attributionDetails.assert.deleteButtonIsVisible();
  await attributionDetails.assert.deleteGloballyButtonIsHidden();

  await attributionDetails.deleteButton.click();
  await confirmationPopup.confirm();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithAttributions: 0,
  });
});

test('deletes multiple attributions at once', async ({
  attributionDetails,
  attributionList,
  confirmationPopup,
  resourceBrowser,
}) => {
  await attributionList.attributionCard.assert.checkboxIsUnchecked(
    packageInfo1,
  );
  await attributionList.attributionCard.assert.checkboxIsUnchecked(
    packageInfo2,
  );

  await attributionList.attributionCard.checkbox(packageInfo1).click();
  await attributionList.attributionCard.checkbox(packageInfo2).click();
  await attributionList.attributionCard.assert.checkboxIsChecked(packageInfo1);
  await attributionList.attributionCard.assert.checkboxIsChecked(packageInfo2);

  await attributionList.deleteButton.click();
  await confirmationPopup.assert.hasText('2 attributions');

  await confirmationPopup.confirm();
  await confirmationPopup.assert.isHidden();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
  await attributionDetails.assert.isHidden();
  await resourceBrowser.assert.isHidden();
});
