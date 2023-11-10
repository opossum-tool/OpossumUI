// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  wasPreferred: true,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  wasPreferred: true,
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
      manualAttributions: faker.opossum.manualAttributions({
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

test('removes was-preferred status from attribution when user saves changes', async ({
  attributionDetails,
  attributionList,
  modifyWasPreferredAttributionPopup,
  notSavedPopup,
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName4);
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    packageInfo2,
  );

  await attributionDetails.comment().fill(faker.lorem.sentence());
  await attributionDetails.saveButton.click();
  await modifyWasPreferredAttributionPopup.assert.isVisible();

  await modifyWasPreferredAttributionPopup.cancelButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    packageInfo2,
  );

  await attributionDetails.saveButton.click();
  await modifyWasPreferredAttributionPopup.saveButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsHidden(
    packageInfo2,
  );

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    packageInfo1,
  );

  await attributionDetails.comment().fill(faker.lorem.sentence());
  await topBar.gotoAttributionView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.saveGloballyButton.click();
  await modifyWasPreferredAttributionPopup.assert.isVisible();

  await modifyWasPreferredAttributionPopup.saveGloballyButton.click();
  await attributionList.attributionCard.assert.wasPreferredIconIsHidden(
    packageInfo2,
  );
  await attributionList.attributionCard.assert.wasPreferredIconIsHidden(
    packageInfo1,
  );
});
