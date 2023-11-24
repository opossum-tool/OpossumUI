// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
const externalAttributionSource = faker.opossum.externalAttributionSource({
  isRelevantForPreferred: true,
});
const [attributionId3, packageInfo3] = faker.opossum.externalAttribution({
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
      externalAttributions: faker.opossum.externalAttributions({
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

test('marks and unmarks an attribution as preferred globally if user saves globally via button', async ({
  attributionDetails,
  changePreferredStatusGloballyPopup,
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

    await attributionDetails.comment().fill(preferLocallyComment);
    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await attributionDetails.saveButton.click();
    await changePreferredStatusGloballyPopup.assert.isHidden();

    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
    await attributionDetails.assert.commentIs(preferLocallyComment);
  });

  await test.step('prefer attribution globally', async () => {
    await resourceBrowser.goto(resourceName2);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await attributionDetails.saveGloballyButton.click();
    await changePreferredStatusGloballyPopup.assert.markAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.okButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );

    await resourceBrowser.goto(resourceName3);
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
  });

  await test.step('unmark preferred globally', async () => {
    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.unmarkAsPreferred.click();

    await attributionDetails.saveGloballyButton.click();
    await changePreferredStatusGloballyPopup.assert.unmarkAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.okButton.click();
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
    await attributionDetails.assert.commentIs(preferLocallyComment);
  });
});

test('marks and unmarks an attribution as preferred globally if user navigates away and saves', async ({
  attributionDetails,
  changePreferredStatusGloballyPopup,
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
    await attributionDetails.copyright.fill(preferLocallyCopyright);
    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await topBar.gotoAttributionView();
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveButton.click();
    await changePreferredStatusGloballyPopup.assert.isHidden();

    await topBar.gotoAuditView();
    await resourceBrowser.goto(resourceName1);
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
    await attributionDetails.assert.copyrightIs(preferLocallyCopyright);
  });

  await test.step('prefer attribution globally', async () => {
    await resourceBrowser.goto(resourceName2);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await resourceBrowser.goto(resourceName3);
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveGloballyButton.click();
    await changePreferredStatusGloballyPopup.assert.markAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.okButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
  });

  await test.step('unmark preferred globally', async () => {
    await resourceDetails.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.unmarkAsPreferred.click();
    await resourceBrowser.goto(resourceName2);
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveGloballyButton.click();
    await changePreferredStatusGloballyPopup.assert.unmarkAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.okButton.click();
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
  });
});

test('popup is only shown if necessary and undo reverts preference status only', async ({
  attributionDetails,
  changePreferredStatusGloballyPopup,
  notSavedPopup,
  resourceBrowser,
  resourceDetails,
  menuBar,
  topBar,
}) => {
  await menuBar.toggleQaMode();

  await test.step('popup is not shown if attribution has a single resource', async () => {
    await resourceBrowser.goto(resourceName4);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo2,
    );

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await attributionDetails.saveGloballyButton.isHidden();
    await resourceBrowser.goto(resourceName3);
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveGloballyButton.isHidden();
    await notSavedPopup.saveButton.click();
    await changePreferredStatusGloballyPopup.assert.isHidden();
  });

  await test.step('cancel button preserves changes and prevents navigating away', async () => {
    const comment = faker.lorem.sentence();

    await resourceBrowser.goto(resourceName3);
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();

    await attributionDetails.comment().fill(comment);
    await topBar.gotoAttributionView();
    await notSavedPopup.assert.isVisible();

    await notSavedPopup.saveGloballyButton.click();
    await changePreferredStatusGloballyPopup.assert.markAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.cancelButton.click();
    await topBar.assert.auditViewIsActive();
    await resourceDetails.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
    await attributionDetails.assert.commentIs(comment);

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
      'unmarkAsPreferred',
    );
  });
});

test('popup if attribution is marked as preferred and saved in attribution view', async ({
  attributionDetails,
  attributionList,
  changePreferredStatusGloballyPopup,
  menuBar,
  topBar,
}) => {
  await menuBar.toggleQaMode();

  await test.step('prefer attribution with multiple resources and click save button', async () => {
    await topBar.gotoAttributionView();
    await attributionList.attributionCard.click(packageInfo1);
    await attributionList.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await attributionDetails.saveButton.click();
    await changePreferredStatusGloballyPopup.assert.markAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.okButton.click();
    await attributionList.attributionCard.assert.preferredIconIsVisible(
      packageInfo1,
    );
  });

  await test.step('prefer attribution with multiple resources and save via menu', async () => {
    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.unmarkAsPreferred.click();
    await menuBar.saveChanges();
    await changePreferredStatusGloballyPopup.assert.unmarkAsPreferredWarningIsVisible();

    await changePreferredStatusGloballyPopup.okButton.click();
    await attributionList.attributionCard.assert.preferredIconIsHidden(
      packageInfo1,
    );
  });

  await test.step('warning popup is not shown if attribution with single resource is marked as preferred', async () => {
    await attributionList.attributionCard.click(packageInfo2);
    await attributionList.attributionCard.assert.preferredIconIsHidden(
      packageInfo2,
    );

    await attributionDetails.openHamburgerMenu();
    await attributionDetails.hamburgerMenu.markAsPreferred.click();
    await menuBar.saveChanges();
    await changePreferredStatusGloballyPopup.assert.isHidden();
    await attributionList.attributionCard.assert.preferredIconIsVisible(
      packageInfo2,
    );
  });
});
