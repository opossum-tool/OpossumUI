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
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  preSelected: true,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  preSelected: true,
});
const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
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
        [resourceName5]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
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

test('deletes pre-selected attributions via context menu', async ({
  attributionDetails,
  attributionList,
  confirmationPopup,
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.attributionCard.click(packageInfo3);
  await attributionDetails.assert.matchesPackageInfo(packageInfo3);
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 5,
  });

  await resourceDetails.attributionCard.openContextMenu(packageInfo3);
  await resourceDetails.attributionCard.contextMenu.deleteGloballyButton.click();
  await confirmationPopup.assert.isHidden();
  await attributionDetails.assert.isEmpty();

  await resourceDetails.attributionCard.click(packageInfo1);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await resourceDetails.attributionCard.openContextMenu(packageInfo1);
  await resourceDetails.attributionCard.contextMenu.deleteButton.click();
  await attributionDetails.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 4,
  });

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await resourceBrowser.goto(resourceName4);
  await attributionDetails.assert.matchesPackageInfo(packageInfo2);

  await resourceDetails.gotoGlobalTab();
  await resourceDetails.signalCard.openContextMenu(packageInfo1);
  await resourceDetails.signalCard.contextMenu.deleteGloballyButton.click();
  await attributionDetails.assert.matchesPackageInfo(packageInfo2);

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 2,
  });

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.isEmpty();

  await topBar.gotoAttributionView();
  await resourceBrowser.assert.isHidden();

  await attributionList.attributionCard.openContextMenu(packageInfo2);
  await attributionList.attributionCard.contextMenu.deleteGloballyButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithAttributions: 0,
  });
});

test('deletes pre-selected attributions via hamburger menu', async ({
  attributionDetails,
  attributionList,
  confirmationPopup,
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.attributionCard.click(packageInfo3);
  await attributionDetails.assert.matchesPackageInfo(packageInfo3);
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 5,
  });

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.deleteGloballyButton.click();
  await confirmationPopup.assert.isHidden();
  await attributionDetails.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 5,
  });

  await resourceDetails.attributionCard.click(packageInfo1);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.deleteButton.click();
  await attributionDetails.assert.isEmpty();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 4,
  });

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.deleteGloballyButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 2,
  });

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.isEmpty();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden('deleteButton');

  await topBar.gotoAttributionView();
  await resourceBrowser.assert.isHidden();

  await attributionList.attributionCard.click(packageInfo2);
  await attributionDetails.assert.matchesPackageInfo(packageInfo2);

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'deleteGloballyButton',
  );

  await attributionDetails.hamburgerMenu.deleteButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 5,
    filesWithOnlyPreSelectedAttributions: 0,
  });
});
