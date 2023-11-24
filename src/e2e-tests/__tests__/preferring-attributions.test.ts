// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const source = faker.opossum.source();
const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.externalAttribution({ source });
const [manualAttributionId, manualPackageInfo] =
  faker.opossum.manualAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [externalAttributionId],
      }),
      externalAttributionSources: faker.opossum.externalAttributionSources({
        [source.name]: faker.opossum.externalAttributionSource({
          isRelevantForPreferred: true,
        }),
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [manualAttributionId]: manualPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [manualAttributionId],
        [faker.opossum.filePath(resourceName2)]: [manualAttributionId],
      }),
    }),
  },
});

test('allows QA user to mark and unmark attributions as preferred in audit view', async ({
  attributionDetails,
  menuBar,
  resourceBrowser,
}) => {
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.matchesPackageInfo(manualPackageInfo);
  await attributionDetails.assert.saveGloballyButtonIsDisabled();
  await attributionDetails.comment().fill(faker.lorem.sentence());
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.saveGloballyButtonIsEnabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'markAsPreferred',
  );

  await menuBar.toggleQaMode();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
    'markAsPreferred',
  );

  await attributionDetails.hamburgerMenu.markAsPreferred.click();
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.saveGloballyButtonIsEnabled();
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'markAsPreferred',
  );

  await attributionDetails.hamburgerMenu.unmarkAsPreferred.click();
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.saveGloballyButtonIsEnabled();
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
    'markAsPreferred',
  );
});

test('allows QA user to mark and unmark attributions as preferred in attribution view', async ({
  attributionDetails,
  changePreferredStatusGloballyPopup,
  menuBar,
  attributionList,
  topBar,
}) => {
  await topBar.gotoAttributionView();
  await attributionList.attributionCard.click(manualPackageInfo);
  await attributionDetails.assert.matchesPackageInfo(manualPackageInfo);
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.comment().fill(faker.lorem.sentence());
  await attributionDetails.assert.saveButtonIsEnabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'markAsPreferred',
  );

  await menuBar.toggleQaMode();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
    'markAsPreferred',
  );

  await attributionDetails.hamburgerMenu.markAsPreferred.click();
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.saveButton.click();
  await changePreferredStatusGloballyPopup.assert.markAsPreferredWarningIsVisible();
  await changePreferredStatusGloballyPopup.okButton.click();
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'markAsPreferred',
  );

  await attributionDetails.hamburgerMenu.unmarkAsPreferred.click();
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden(
    'unmarkAsPreferred',
  );
  await attributionDetails.assert.buttonInHamburgerMenuIsVisible(
    'markAsPreferred',
  );
});
