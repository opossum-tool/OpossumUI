// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.externalAttribution();
const [manualAttributionId1, manualPackageInfo1] =
  faker.opossum.manualAttribution();
const [manualAttributionId2, manualPackageInfo2] =
  faker.opossum.manualAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: 1,
        },
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [manualAttributionId1]: manualPackageInfo1,
        [manualAttributionId2]: manualPackageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [manualAttributionId1],
        [faker.opossum.filePath(resourceName3)]: [manualAttributionId2],
        [faker.opossum.filePath(resourceName4)]: [manualAttributionId1],
      }),
    }),
  },
});

test('shows resources belonging to attributions', async ({
  attributionDetails,
  attributionList,
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  resourcePathPopup,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.gotoRoot();
  await resourceDetails.assert.signalsInFolderContentAccordionIsVisible();
  await resourceDetails.signalCard.assert.isVisible(externalPackageInfo);

  await resourceDetails.signalCard.openContextMenu(externalPackageInfo);
  await resourceDetails.signalCard.contextMenu.showResourcesButton.click();
  await resourcePathPopup.assert.titleIsVisible();

  await resourcePathPopup.goto(resourceName1);
  await resourceDetails.assert.resourcePathIsVisible(resourceName1);
  await resourceDetails.signalCard.assert.isVisible(externalPackageInfo);

  await resourceDetails.attributionCard.openContextMenu(manualPackageInfo1);
  await resourceDetails.attributionCard.contextMenu.showResourcesButton.click();
  await resourcePathPopup.goto(resourceName4);
  await resourceDetails.assert.resourcePathIsVisible(resourceName4);
  await attributionDetails.assert.matchesPackageInfo(manualPackageInfo1);

  await resourceDetails.gotoGlobalTab();
  await resourceDetails.signalCard.openContextMenu(manualPackageInfo2);
  await resourceDetails.signalCard.contextMenu.showResourcesButton.click();
  await resourcePathPopup.goto(resourceName3);
  await resourceDetails.assert.resourcePathIsVisible(resourceName3);
  await attributionDetails.assert.matchesPackageInfo(manualPackageInfo2);

  await topBar.gotoAttributionView();
  await resourceBrowser.assert.isHidden();

  await attributionList.attributionCard.openContextMenu(manualPackageInfo2);
  await attributionList.attributionCard.contextMenu.showResourcesButton.click();
  await resourcePathPopup.goto(resourceName3);
  await attributionDetails.assert.matchesPackageInfo(manualPackageInfo2);

  await topBar.gotoAttributionView();
  await attributionList.attributionCard.click(manualPackageInfo1);
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.assert.resourcePathIsVisible(resourceName1);
});
