// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const externalAttributionSource = faker.opossum.externalAttributionSource({
  isRelevantForPreferred: true,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  source: faker.opossum.source({ name: externalAttributionSource.name }),
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
      externalAttributionSources: faker.opossum.externalAttributionSources({
        externalAttributionSource,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId3],
        [faker.opossum.filePath(resourceName2)]: [attributionId3],
        [faker.opossum.filePath(resourceName3)]: [attributionId3],
        [faker.opossum.filePath(resourceName4)]: [attributionId3],
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

test('marks and unmarks an attribution as preferred globally if user saves globally via button', async ({
  attributionDetails,
  resourceBrowser,
  resourceDetails,
  menuBar,
}) => {
  await menuBar.toggleQaMode();
  const preferLocallyComment = faker.lorem.sentence();

  await test.step('prefer attribution locally', async () => {
    await resourceBrowser.goto(resourceName1);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );

    await attributionDetails.attributionForm
      .comment()
      .fill(preferLocallyComment);
    await attributionDetails.attributionForm.openAuditingOptionsMenu();
    await attributionDetails.attributionForm.auditingOptionsMenu.currentlyPreferredOption.click();
    await attributionDetails.attributionForm.closeAuditingOptionsMenu();
    await attributionDetails.saveButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
    await attributionDetails.attributionForm.assert.commentIs(
      preferLocallyComment,
    );
  });

  await test.step('prefer attribution globally', async () => {
    await resourceBrowser.goto(resourceName2);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );

    await attributionDetails.attributionForm.openAuditingOptionsMenu();
    await attributionDetails.attributionForm.auditingOptionsMenu.currentlyPreferredOption.click();
    await attributionDetails.attributionForm.closeAuditingOptionsMenu();
    await attributionDetails.selectSaveMenuOption('saveGlobally');
    await attributionDetails.saveGloballyButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );

    await resourceBrowser.goto(resourceName3);
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
  });

  await test.step('unmark preferred globally', async () => {
    await attributionDetails.attributionForm.removeAuditingLabel(
      'currentlyPreferredLabel',
    );
    await attributionDetails.selectSaveMenuOption('saveGlobally');
    await attributionDetails.saveGloballyButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );

    await resourceBrowser.goto(resourceName2);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
  });

  await test.step('check that independent attribution is not modified', async () => {
    await resourceBrowser.goto(resourceName4);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo2,
    );
  });

  await test.step('check locally preferred attribution is unchanged', async () => {
    await resourceBrowser.goto(resourceName1);
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
    await attributionDetails.attributionForm.assert.commentIs(
      preferLocallyComment,
    );
  });
});

test('marks and unmarks an attribution as preferred globally if user navigates away and saves', async ({
  attributionDetails,
  notSavedPopup,
  resourceBrowser,
  resourceDetails,
  menuBar,
  topBar,
}) => {
  await menuBar.toggleQaMode();
  const preferLocallyCopyright = faker.lorem.sentence();

  await test.step('prefer attribution locally', async () => {
    await resourceBrowser.goto(resourceName1);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
    await attributionDetails.attributionForm.copyright.fill(
      preferLocallyCopyright,
    );
    await attributionDetails.attributionForm.openAuditingOptionsMenu();
    await attributionDetails.attributionForm.auditingOptionsMenu.currentlyPreferredOption.click();
    await attributionDetails.attributionForm.closeAuditingOptionsMenu();
    await topBar.gotoReportView();
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveButton.click();
    await topBar.gotoAuditView();
    await resourceBrowser.goto(resourceName1);
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
    await attributionDetails.attributionForm.assert.copyrightIs(
      preferLocallyCopyright,
    );
  });

  await test.step('prefer attribution globally', async () => {
    await resourceBrowser.goto(resourceName2);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
    await attributionDetails.attributionForm.openAuditingOptionsMenu();
    await attributionDetails.attributionForm.auditingOptionsMenu.currentlyPreferredOption.click();
    await attributionDetails.attributionForm.closeAuditingOptionsMenu();
    await resourceBrowser.goto(resourceName3);
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveGloballyButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
  });

  await test.step('unmark preferred globally', async () => {
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );

    await attributionDetails.attributionForm.removeAuditingLabel(
      'currentlyPreferredLabel',
    );
    await resourceBrowser.goto(resourceName2);
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveGloballyButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
  });
});
