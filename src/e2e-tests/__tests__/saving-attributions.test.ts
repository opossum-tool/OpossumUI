// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { expect, faker, test } from '../utils';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  packageType: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  packageType: undefined,
  licenseName: license1.fullName,
});
const [wasPreferredAttributionId, wasPreferredPackageInfo] =
  faker.opossum.manualAttribution({
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
      frequentLicenses: [license1, license2],
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [wasPreferredAttributionId]: wasPreferredPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.filePath(resourceName5)]: [wasPreferredAttributionId],
      }),
    }),
  },
});

test('adds a new third-party attribution in audit view', async ({
  attributionDetails,
  notSavedPopup,
  resourceBrowser,
  resourceDetails,
  window,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    attributionConfidence: DiscreteConfidence.High,
    licenseName: license1.fullName,
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
  await attributionDetails.assert.saveGloballyButtonIsHidden();
  await attributionDetails.assert.revertButtonIsDisabled();

  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsVisible();

  await attributionDetails.licenseText.fill(newPackageInfo.licenseText!);
  await attributionDetails.assert.licenseTextIs(newPackageInfo.licenseText!);

  await attributionDetails.toggleLicenseTextVisibility();
  await attributionDetails.assert.licenseTextIsHidden();

  await attributionDetails.selectAttributionType('First Party');
  await attributionDetails.assert.matchesPackageInfo({
    ...packageInfo1,
    firstParty: true,
  });

  await attributionDetails.selectAttributionType('Third Party');
  await attributionDetails.name.fill(newPackageInfo.packageName!);
  await attributionDetails.version.fill(newPackageInfo.packageVersion!);
  await attributionDetails.url.fill(newPackageInfo.url!);
  await attributionDetails.copyright.fill(newPackageInfo.copyright!);
  await attributionDetails.licenseName.fill(newPackageInfo.licenseName!);
  await attributionDetails.comment().fill(newPackageInfo.comment!);
  await attributionDetails.assert.matchesPackageInfo(newPackageInfo);
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.revertButtonIsEnabled();

  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.revertButtonIsDisabled();

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  const newPackageName = faker.internet.domainWord();
  await resourceBrowser.goto(resourceName3);
  await attributionDetails.name.fill(newPackageName);
  await attributionDetails.selectSaveMenuOption('saveGlobally');
  await attributionDetails.assert.saveButtonIsHidden();
  await attributionDetails.assert.saveGloballyButtonIsVisible();

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
  await attributionDetails.assert.revertButtonIsDisabled();

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
  await attributionDetails.assert.revertButtonIsEnabled();

  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.revertButtonIsDisabled();
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
  await reportView.assert.matchesPackageInfo(newPackageInfo);
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

  await notSavedPopup.discardButton.click();
  await attributionDetails.assert.isEmpty();

  await attributionDetails.comment().fill(faker.lorem.sentences());
  await topBar.gotoReportView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await topBar.gotoAttributionView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.discardButton.click();
  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.comment().fill(faker.lorem.sentences());
  await topBar.gotoAuditView();
  await notSavedPopup.assert.isVisible();
});

test('removes was-preferred status from attribution when user saves changes', async ({
  attributionDetails,
  confirmationDialog,
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.goto(resourceName5);
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.assert.auditingLabelIsVisible(
    'previouslyPreferredLabel',
  );

  await attributionDetails.comment().fill(faker.lorem.sentence());
  await confirmationDialog.assert.isVisible();

  await confirmationDialog.cancelButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.comment().fill(faker.lorem.sentence());
  await confirmationDialog.okButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.assert.auditingLabelIsHidden(
    'previouslyPreferredLabel',
  );

  await attributionDetails.saveButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
});
