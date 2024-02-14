// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution();
const [manualAttributionId1, manualPackageInfo1] =
  faker.opossum.rawAttribution();
const [manualAttributionId2, manualPackageInfo2] =
  faker.opossum.rawAttribution();

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
      externalAttributions: faker.opossum.rawAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
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
  resourceBrowser,
  resourceDetails,
  resourcePathPopup,
}) => {
  await resourceBrowser.gotoRoot();
  await resourceDetails.assert.signalsInFolderContentAccordionIsVisible();
  await resourceDetails.signalCard.assert.isVisible(externalPackageInfo);

  await resourceDetails.signalCard
    .showResourcesButton(externalPackageInfo)
    .click();
  await resourcePathPopup.assert.titleIsVisible();

  await resourcePathPopup.goto(resourceName1);
  await resourceDetails.assert.breadcrumbsAreVisible(resourceName1);
  await resourceDetails.signalCard.assert.isVisible(externalPackageInfo);

  await resourceDetails.attributionCard
    .showResourcesButton(manualPackageInfo1)
    .click();
  await resourcePathPopup.goto(resourceName4);
  await resourceDetails.assert.breadcrumbsAreVisible(resourceName4);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo1,
  );

  await resourceDetails.gotoGlobalTab();
  await resourceDetails.signalCard
    .showResourcesButton(manualPackageInfo2)
    .click();
  await resourcePathPopup.goto(resourceName3);
  await resourceDetails.assert.breadcrumbsAreVisible(resourceName3);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo2,
  );
});
