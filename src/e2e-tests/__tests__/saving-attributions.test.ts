// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { expect, faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  packageType: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  packageType: undefined,
  licenseName: license1.shortName,
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
      frequentLicenses: [license1, license2],
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
      }),
    }),
  },
});

test('adds a new attribution in audit view', async ({
  attributionDetails,
  notSavedPopup,
  resourceBrowser,
  resourceDetails,
  window,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    attributionConfidence: DiscreteConfidence.High,
    licenseName: license1.shortName,
    packageType: undefined,
  });
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.addNewAttributionButton.click({ button: 'right' });
  await expect(window.getByRole('menu')).toBeHidden(); // add new attribution button has no context menu
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await resourceDetails.addNewAttributionButton.click();
  await attributionDetails.assert.isEmpty();

  await attributionDetails.name.fill(newPackageInfo.packageName!);
  await attributionDetails.version.fill(newPackageInfo.packageVersion!);
  await attributionDetails.url.fill(newPackageInfo.url!);
  await attributionDetails.copyright.fill(newPackageInfo.copyright!);
  await attributionDetails.licenseName.click();
  await attributionDetails.selectLicense(license1);
  await attributionDetails.assert.matchesPackageInfo(newPackageInfo);

  await resourceBrowser.goto(resourceName2);
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await resourceDetails.attributionCard.assert.isVisible(newPackageInfo);
});

test('allows user to edit an existing attribution locally and globally in audit view', async ({
  attributionDetails,
  resourceBrowser,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo1.attributionConfidence,
    packageType: undefined,
  });
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.licenseTextIsHidden();
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.saveGloballyButtonIsDisabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsDisabled('undoButton');

  await attributionDetails.closeHamburgerMenu();
  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsVisible();

  await attributionDetails.licenseText.fill(newPackageInfo.licenseText!);
  await attributionDetails.assert.licenseTextIs(newPackageInfo.licenseText!);

  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsHidden();

  await attributionDetails.name.fill(newPackageInfo.packageName!);
  await attributionDetails.version.fill(newPackageInfo.packageVersion!);
  await attributionDetails.url.fill(newPackageInfo.url!);
  await attributionDetails.copyright.fill(newPackageInfo.copyright!);
  await attributionDetails.licenseName.fill(newPackageInfo.licenseName!);
  await attributionDetails.comment().fill(newPackageInfo.comment!);
  await attributionDetails.assert.matchesPackageInfo(newPackageInfo);
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.saveGloballyButtonIsEnabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsEnabled('undoButton');

  await attributionDetails.closeHamburgerMenu();
  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.saveGloballyButtonIsHidden();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsDisabled('undoButton');

  await attributionDetails.closeHamburgerMenu();
  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  const newPackageName = faker.internet.domainWord();
  await resourceBrowser.goto(resourceName3);
  await attributionDetails.name.fill(newPackageName);
  await attributionDetails.saveGloballyButton.click();

  await resourceBrowser.goto(resourceName4);
  await attributionDetails.assert.nameIs(newPackageName);
});

test('displays and edits an existing attribution in attribution view', async ({
  attributionDetails,
  attributionList,
  resourceBrowser,
  topBar,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo1.attributionConfidence,
    packageType: undefined,
  });
  await topBar.gotoAttributionView();
  await resourceBrowser.assert.isHidden();
  await attributionDetails.assert.isHidden();

  await attributionList.attributionCard.click(packageInfo1);
  await resourceBrowser.assert.isVisible();
  await attributionDetails.assert.isVisible();
  await resourceBrowser.assert.resourceIsVisible(resourceName1);
  await resourceBrowser.assert.resourceIsVisible(resourceName2);
  await resourceBrowser.assert.resourceIsHidden(resourceName3);
  await resourceBrowser.assert.resourceIsHidden(resourceName4);
  await attributionDetails.assert.licenseTextIsHidden();
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);
  await attributionDetails.assert.saveButtonIsDisabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsDisabled('undoButton');

  await attributionDetails.closeHamburgerMenu();
  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsVisible();

  await attributionDetails.licenseText.fill(newPackageInfo.licenseText!);
  await attributionDetails.assert.licenseTextIs(newPackageInfo.licenseText!);

  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsHidden();

  await attributionDetails.name.fill(newPackageInfo.packageName!);
  await attributionDetails.version.fill(newPackageInfo.packageVersion!);
  await attributionDetails.url.fill(newPackageInfo.url!);
  await attributionDetails.copyright.fill(newPackageInfo.copyright!);
  await attributionDetails.licenseName.fill(newPackageInfo.licenseName!);
  await attributionDetails.comment().fill(newPackageInfo.comment!);
  await attributionDetails.assert.matchesPackageInfo(newPackageInfo);
  await attributionDetails.assert.saveButtonIsEnabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsEnabled('undoButton');

  await attributionDetails.closeHamburgerMenu();
  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();

  await attributionDetails.openHamburgerMenu();
  await attributionDetails.assert.buttonInHamburgerMenuIsDisabled('undoButton');
});

test('allows user to edit an existing attribution in report view', async ({
  attributionDetails,
  editAttributionPopup,
  reportView,
  topBar,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo1.attributionConfidence,
    packageType: undefined,
  });
  await topBar.gotoReportView();
  await reportView.assert.matchesPackageInfo(packageInfo1);
  await reportView.assert.matchesPackageInfo({
    ...packageInfo2,
    licenseText: license1.defaultText,
  });

  await reportView.editAttribution(packageInfo1);
  await editAttributionPopup.assert.isVisible();
  await editAttributionPopup.assert.saveButtonIsDisabled();
  await attributionDetails.assert.licenseTextIsHidden();
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsVisible();

  await attributionDetails.licenseText.fill(newPackageInfo.licenseText!);
  await attributionDetails.assert.licenseTextIs(newPackageInfo.licenseText!);

  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsHidden();

  await attributionDetails.name.fill(newPackageInfo.packageName!);
  await attributionDetails.version.fill(newPackageInfo.packageVersion!);
  await attributionDetails.url.fill(newPackageInfo.url!);
  await attributionDetails.copyright.fill(newPackageInfo.copyright!);
  await attributionDetails.licenseName.fill(newPackageInfo.licenseName!);
  await attributionDetails.comment().fill(newPackageInfo.comment!);
  await attributionDetails.assert.matchesPackageInfo(newPackageInfo);
  await editAttributionPopup.assert.saveButtonIsEnabled();

  await editAttributionPopup.saveButton.click();
  await editAttributionPopup.assert.isHidden();
  await reportView.assert.matchesPackageInfo({
    ...newPackageInfo,
    attributionConfidence: DiscreteConfidence.High,
  });
});

test('adds a new attribution via PURL', async ({
  attributionDetails,
  resourceBrowser,
  resourceDetails,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    attributionConfidence: DiscreteConfidence.High,
    packageNamespace: faker.internet.domainWord(),
    licenseName: undefined,
    url: undefined,
    copyright: undefined,
  });
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await resourceDetails.addNewAttributionButton.click();
  await attributionDetails.assert.isEmpty();

  await attributionDetails.purl.fill(
    `pkg:${newPackageInfo.packageType}/${newPackageInfo.packageNamespace}/${newPackageInfo.packageName}@${newPackageInfo.packageVersion}`,
  );
  await attributionDetails.assert.matchesPackageInfo(newPackageInfo);

  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await resourceDetails.attributionCard.assert.isVisible(newPackageInfo);
});

test('warns user of unsaved changes if user attempts to navigate away before saving', async ({
  attributionDetails,
  attributionList,
  notSavedPopup,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.comment().fill(faker.lorem.sentences());

  await resourceDetails.addNewAttributionButton.click();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.undoButton.click();
  await attributionDetails.assert.isEmpty();

  await attributionDetails.comment().fill(faker.lorem.sentences());
  await topBar.gotoReportView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await topBar.gotoAttributionView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.undoButton.click();
  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.comment().fill(faker.lorem.sentences());
  await topBar.gotoAuditView();
  await notSavedPopup.assert.isVisible();
});
