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

test('updates progress bar when user confirms preselected attributions', async ({
  attributionDetails,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithOnlyPreSelectedAttributions: 4,
  });
  await attributionDetails.assert.confirmButtonIsVisible();
  await attributionDetails.assert.confirmGloballyButtonIsHidden();
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'preselectedLabel',
  );

  await resourceDetails.attributionCard.click(packageInfo1);
  await attributionDetails.confirmButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithAttributions: 1,
    filesWithOnlyPreSelectedAttributions: 3,
  });
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionDetails.assert.confirmGloballyButtonIsHidden();
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'preselectedLabel',
  );

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await attributionDetails.selectConfirmMenuOption('confirmGlobally');
  await attributionDetails.confirmGloballyButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithAttributions: 3,
    filesWithOnlyPreSelectedAttributions: 1,
  });

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionDetails.assert.confirmGloballyButtonIsHidden();
});

test('confirms multiple preselected attributions', async ({
  attributionList,
  attributionDetails,
}) => {
  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.assert.confirmButtonIsVisible();
  await attributionList.attributionCard.click(packageInfo2);
  await attributionDetails.assert.confirmButtonIsVisible();

  await attributionList.attributionCard.checkbox(packageInfo1).click();
  await attributionList.attributionCard.checkbox(packageInfo2).click();
  await attributionList.confirmButton.click();

  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionList.attributionCard.click(packageInfo2);
  await attributionDetails.assert.confirmButtonIsHidden();
});
