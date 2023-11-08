// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { faker, test } from '../utils';

const metadata = faker.opossum.metadata();
const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const resourceName5 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  attributionConfidence: DiscreteConfidence.High,
});
const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
  preSelected: true,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      metadata,
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: { [resourceName3]: 1, [resourceName4]: 1 },
        },
        [resourceName5]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      metadata,
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName4)]: [
          attributionId2,
          attributionId3,
        ],
      }),
    }),
  },
});

test('replaces attributions via context menu in audit view ', async ({
  attributionDetails,
  projectStatisticsPopup,
  replaceAttributionPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1, resourceName2, resourceName3);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  await resourceDetails.attributionCard.openContextMenu(packageInfo1);
  await resourceDetails.attributionCard.contextMenu.markForReplacementButton.click();
  await resourceBrowser.goto(resourceName4);
  await resourceDetails.attributionCard.click(packageInfo2);
  await attributionDetails.assert.matchPackageInfo(packageInfo2);

  await resourceDetails.attributionCard.openContextMenu(packageInfo2);
  await resourceDetails.attributionCard.contextMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.cancel();

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  await resourceBrowser.goto(resourceName4);
  await resourceDetails.attributionCard.click(packageInfo2);
  await resourceDetails.attributionCard.openContextMenu(packageInfo2);
  await resourceDetails.attributionCard.contextMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.replace();
  await attributionDetails.assert.matchPackageInfo(packageInfo2);

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.matchPackageInfo({
    ...packageInfo2,
    attributionConfidence: DiscreteConfidence.High,
  });

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo3);

  await resourceDetails.signalCard.openContextMenu(packageInfo3);
  await resourceDetails.signalCard.contextMenu.markForReplacementButton.click();
  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.replace();
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.assert.isHidden(packageInfo3);
});

test('replaces attributions via hamburger menu in audit view ', async ({
  attributionDetails,
  projectStatisticsPopup,
  replaceAttributionPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1, resourceName2, resourceName3);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.markForReplacementButton.click();
  await resourceBrowser.goto(resourceName4);
  await resourceDetails.attributionCard.click(packageInfo2);
  await attributionDetails.assert.matchPackageInfo(packageInfo2);

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.cancel();

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  await resourceBrowser.goto(resourceName4);
  await resourceDetails.attributionCard.click(packageInfo2);
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.replace();
  await attributionDetails.assert.matchPackageInfo(packageInfo2);

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.matchPackageInfo({
    ...packageInfo2,
    attributionConfidence: DiscreteConfidence.High,
  });

  await resourceBrowser.goto(resourceName4);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo2);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo3);

  await resourceDetails.attributionCard.click(packageInfo3);
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.markForReplacementButton.click();
  await resourceDetails.attributionCard.click(packageInfo2);
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.hamburgerMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.replace();
  await resourceDetails.attributionCard.assert.isVisible(packageInfo2);
  await resourceDetails.attributionCard.assert.isHidden(packageInfo3);
});

test('replaces attributions via context menu in attribution view', async ({
  attributionDetails,
  attributionList,
  projectStatisticsPopup,
  replaceAttributionPopup,
  resourceBrowser,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await topBar.gotoAttributionView();
  await resourceBrowser.assert.isHidden();

  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);
  await resourceBrowser.assert.resourceIsVisible(resourceName3);
  await resourceBrowser.assert.resourceIsHidden(resourceName4);

  await attributionList.attributionCard.openContextMenu(packageInfo1);
  await attributionList.attributionCard.contextMenu.markForReplacementButton.click();
  await attributionList.attributionCard.openContextMenu(packageInfo2);
  await attributionList.attributionCard.contextMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.cancel();
  await attributionList.attributionCard.assert.isVisible(packageInfo1);

  await attributionList.attributionCard.openContextMenu(packageInfo2);
  await attributionList.attributionCard.contextMenu.replaceMarkedButton.click();
  await replaceAttributionPopup.replace();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);

  await attributionList.attributionCard.click(packageInfo2);
  await attributionDetails.assert.matchPackageInfo(packageInfo2);
  await resourceBrowser.assert.resourceIsVisible(resourceName3);
  await resourceBrowser.assert.resourceIsVisible(resourceName4);
});
