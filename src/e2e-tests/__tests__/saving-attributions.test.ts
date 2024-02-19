// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { faker, test } from '../utils';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageType: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageType: undefined,
  licenseName: license1.fullName,
});
const [wasPreferredAttributionId, wasPreferredPackageInfo] =
  faker.opossum.rawAttribution({
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
      manualAttributions: faker.opossum.rawAttributions({
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

test('adds a new third-party attribution', async ({
  attributionDetails,
  notSavedPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  const newPackageInfo = faker.opossum.rawPackageInfo({
    attributionConfidence: DiscreteConfidence.High,
    licenseName: license1.fullName,
    packageType: undefined,
  });
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.addNewAttributionButton.click({ button: 'right' });
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await resourceDetails.addNewAttributionButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();

  await attributionDetails.attributionForm.name.fill(
    newPackageInfo.packageName!,
  );
  await attributionDetails.attributionForm.version.fill(
    newPackageInfo.packageVersion!,
  );
  await attributionDetails.attributionForm.url.fill(newPackageInfo.url!);
  await attributionDetails.attributionForm.copyright.fill(
    newPackageInfo.copyright!,
  );
  await attributionDetails.attributionForm.licenseName.click();
  await attributionDetails.attributionForm.selectLicense(license1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    newPackageInfo,
  );

  await resourceBrowser.goto(resourceName2);
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await resourceDetails.attributionCard.assert.isVisible(newPackageInfo);
});

test('allows user to edit an existing attribution locally and globally', async ({
  attributionDetails,
  resourceBrowser,
}) => {
  const newPackageInfo = faker.opossum.rawPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo1.attributionConfidence,
    packageType: undefined,
  });
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.attributionForm.assert.licenseTextIsHidden();
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.saveGloballyButtonIsHidden();
  await attributionDetails.assert.revertButtonIsDisabled();

  await attributionDetails.attributionForm.toggleLicenseTextVisibility();
  await attributionDetails.attributionForm.assert.licenseTextIsVisible();

  await attributionDetails.attributionForm.licenseText.fill(
    newPackageInfo.licenseText!,
  );
  await attributionDetails.attributionForm.assert.licenseTextIs(
    newPackageInfo.licenseText!,
  );

  await attributionDetails.attributionForm.toggleLicenseTextVisibility();
  await attributionDetails.attributionForm.assert.licenseTextIsHidden();

  await attributionDetails.attributionForm.selectAttributionType('First Party');
  await attributionDetails.attributionForm.assert.matchesPackageInfo({
    ...packageInfo1,
    firstParty: true,
  });

  await attributionDetails.attributionForm.selectAttributionType('Third Party');
  await attributionDetails.attributionForm.name.fill(
    newPackageInfo.packageName!,
  );
  await attributionDetails.attributionForm.version.fill(
    newPackageInfo.packageVersion!,
  );
  await attributionDetails.attributionForm.url.fill(newPackageInfo.url!);
  await attributionDetails.attributionForm.copyright.fill(
    newPackageInfo.copyright!,
  );
  await attributionDetails.attributionForm.licenseName.fill(
    newPackageInfo.licenseName!,
  );
  await attributionDetails.attributionForm
    .comment()
    .fill(newPackageInfo.comment!);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    newPackageInfo,
  );
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.revertButtonIsEnabled();

  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.revertButtonIsDisabled();

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  const newPackageName = faker.internet.domainWord();
  await resourceBrowser.goto(resourceName3);
  await attributionDetails.attributionForm.name.fill(newPackageName);
  await attributionDetails.selectSaveMenuOption('saveGlobally');
  await attributionDetails.assert.saveButtonIsHidden();
  await attributionDetails.assert.saveGloballyButtonIsVisible();

  await attributionDetails.saveGloballyButton.click();
  await resourceBrowser.goto(resourceName4);
  await attributionDetails.attributionForm.assert.nameIs(newPackageName);
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
  await attributionDetails.attributionForm
    .comment()
    .fill(faker.lorem.sentences());

  await resourceDetails.addNewAttributionButton.click();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.discardButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();

  await attributionDetails.attributionForm
    .comment()
    .fill(faker.lorem.sentences());
  await topBar.gotoReportView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.discardButton.click();
  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.attributionForm
    .comment()
    .fill(faker.lorem.sentences());
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
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'previouslyPreferredLabel',
  );

  await attributionDetails.attributionForm
    .comment()
    .fill(faker.lorem.sentence());
  await confirmationDialog.assert.isVisible();

  await confirmationDialog.cancelButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm
    .comment()
    .fill(faker.lorem.sentence());
  await confirmationDialog.okButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'previouslyPreferredLabel',
  );

  await attributionDetails.saveButton.click();
  await resourceDetails.attributionCard.assert.wasPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
});
