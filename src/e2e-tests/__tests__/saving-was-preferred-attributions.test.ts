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
  wasPreferred: true,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  wasPreferred: true,
});
const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
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
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId1],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.filePath(resourceName5)]: [attributionId3],
      }),
    }),
  },
});

test('removes was-preferred status from attribution when user saves changes', async ({
  attributionDetails,
  attributionList,
  editAttributionPopup,
  modifyWasPreferredAttributionPopup,
  notSavedPopup,
  reportView,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
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
  await attributionList.assert.isVisible();
  await attributionList.attributionCard.assert.wasPreferredIconIsHidden(
    packageInfo2,
  );
  await attributionList.attributionCard.assert.wasPreferredIconIsHidden(
    packageInfo1,
  );
  await attributionList.attributionCard.assert.wasPreferredIconIsVisible(
    packageInfo3,
  );

  await topBar.gotoReportView();
  await reportView.editAttribution(packageInfo3);
  await attributionDetails.comment().fill(faker.lorem.sentence());
  await editAttributionPopup.saveButton.click();
  await modifyWasPreferredAttributionPopup.assert.isVisible();

  await modifyWasPreferredAttributionPopup.saveButton.click();
  await topBar.gotoAttributionView();
  await attributionList.attributionCard.assert.wasPreferredIconIsHidden(
    packageInfo3,
  );
});
