// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const resourceName5 = faker.opossum.resourceName();
const resourceName6 = faker.opossum.resourceName();
const resourceName7 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.externalAttribution();
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: { [resourceName3]: 1 } },
        [resourceName4]: 1,
        [resourceName5]: { [resourceName6]: { [resourceName7]: 1 } },
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId1]: packageInfo1,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1, resourceName2)]: [
          attributionId1,
        ],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName5, resourceName6)]: [
          attributionId2,
        ],
      }),
    }),
  },
});

test('shows aggregated and parent attributions correctly', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  attributionDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceDetails.assert.signalsAccordionIsHidden();
  await resourceDetails.assert.signalsInFolderContentAccordionIsHidden();
  await resourceDetails.assert.attributionsInFolderContentAccordionIsHidden();

  await resourceBrowser.goto(resourceName1);
  await resourceDetails.assert.signalsAccordionIsVisible();
  await resourceDetails.assert.signalsInFolderContentAccordionIsVisible();
  await resourceDetails.assert.attributionsInFolderContentAccordionIsVisible();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsPanel,
  });

  await resourceBrowser.goto(resourceName5);
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName6);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo2);
  await resourceDetails.assert.overrideParentButtonIsHidden();

  await resourceBrowser.goto(resourceName7);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo2);
  await attributionDetails.assert.matchPackageInfo(packageInfo2);
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden('deleteButton');
  await resourceDetails.assert.overrideParentButtonIsVisible();

  await resourceDetails.overrideParentButton.click();
  await attributionDetails.assert.isEmpty();
});
