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
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageType: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageType: undefined,
  licenseName: license1.fullName,
});
const originId = faker.string.uuid();
const [wasPreferredOriginalAttributionId, wasPreferredOriginalPackageInfo] =
  faker.opossum.rawAttribution({
    wasPreferred: true,
    originIds: [originId],
  });
const [wasPreferredAttributionId, wasPreferredPackageInfo] =
  faker.opossum.rawAttribution({ ...wasPreferredOriginalPackageInfo });

test.use({
  data: {
    inputData: faker.opossum.inputData({
      externalAttributions: faker.opossum.rawAttributions({
        [wasPreferredOriginalAttributionId]: wasPreferredOriginalPackageInfo,
      }),
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

test('warns user of unsaved changes if user attempts to open new file before saving', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
  topBar,
  menuBar,
}) => {
  const comment = faker.lorem.sentences();
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.comment.fill(comment);

  await topBar.openFileButton.click();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await attributionDetails.attributionForm.assert.commentIs(comment);

  await menuBar.openFile();
  await notSavedPopup.assert.isVisible();
});

test('warns user of unsaved changes if user attempts to navigate away before saving', async ({
  attributionDetails,
  attributionsPanel,
  notSavedPopup,
  resourcesTree,
  topBar,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.comment.fill(
    faker.lorem.sentences(),
  );

  await attributionsPanel.createButton.click();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.discardButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();

  await attributionDetails.attributionForm.comment.fill(
    faker.lorem.sentences(),
  );
  await topBar.gotoReportView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.discardButton.click();
  await topBar.assert.reportViewIsActive();
});

test('warns user of unsaved changes if user attempts to import new file before saving', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
  menuBar,
}) => {
  const comment = faker.lorem.sentences();
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.comment.fill(comment);

  await menuBar.importLegacyOpossumFile();
  await notSavedPopup.assert.isVisible();
});

test('warns user of unsaved changes if user attempts to merge file before saving', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
  menuBar,
}) => {
  const comment = faker.lorem.sentences();
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.comment.fill(comment);

  await menuBar.mergeLegacyOpossumFile();
  await notSavedPopup.assert.isVisible();
});

test('warns user of unsaved changes if user attempts to export data before saving', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
  menuBar,
}) => {
  const comment = faker.lorem.sentences();
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.comment.fill(comment);

  await menuBar.exportFollowUp();
  await notSavedPopup.assert.isVisible();
});

test('allows user to update an attribution on the selected resource only', async ({
  attributionDetails,
  resourcesTree,
  confirmSavePopup,
  linkedResourcesTree,
}) => {
  const newPackageInfo = faker.opossum.rawPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo1.attributionConfidence,
    packageType: undefined,
  });

  await resourcesTree.goto(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.revertButtonIsDisabled();

  await attributionDetails.attributionForm.licenseTextToggleButton.click();
  await attributionDetails.attributionForm.licenseText.fill(
    newPackageInfo.licenseText!,
  );
  await attributionDetails.attributionForm.assert.licenseTextIs(
    newPackageInfo.licenseText!,
  );

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
  await attributionDetails.attributionForm.licenseExpression.fill(
    newPackageInfo.licenseName!,
  );
  await attributionDetails.attributionForm.comment.fill(
    newPackageInfo.comment!,
  );
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    newPackageInfo,
  );
  await attributionDetails.assert.saveButtonIsEnabled();
  await attributionDetails.assert.revertButtonIsEnabled();

  await attributionDetails.saveButton.click();
  await confirmSavePopup.assert.isVisible();

  await confirmSavePopup.saveLocallyButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.assert.revertButtonIsDisabled();
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsHidden(resourceName2);
});

test('allows user to update an attribution on all linked resources', async ({
  attributionDetails,
  resourcesTree,
  confirmSavePopup,
  linkedResourcesTree,
}) => {
  const newPackageName = faker.internet.domainWord();

  await resourcesTree.goto(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);

  await attributionDetails.attributionForm.name.fill(newPackageName);
  await attributionDetails.saveButton.click();
  await confirmSavePopup.saveGloballyButton.click();
  // need to make sure that the confirmSavePopup is closed before any assertions
  // are run on linkedResourcesTree, because the confirmSavePopup also contains
  // a LinkedResourcesTree which makes locators resolve to 2 elements
  await confirmSavePopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.nameIs(newPackageName);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName2);
});

test('allows user to revert changes', async ({
  attributionDetails,
  resourcesTree,
}) => {
  const newPackageName = faker.internet.domainWord();

  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await attributionDetails.attributionForm.name.fill(newPackageName);
  await attributionDetails.attributionForm.assert.matchesPackageInfo({
    ...packageInfo1,
    packageName: newPackageName,
  });

  await attributionDetails.revertButton.click();
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
});

test('switches correctly between previously-preferred and modified previously preferred statuses of an attribution', async ({
  attributionDetails,
  confirmationDialog,
  resourcesTree,
  attributionsPanel,
}) => {
  await resourcesTree.goto(resourceName5);
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'previouslyPreferredLabel',
  );

  await attributionDetails.attributionForm.comment.fill(faker.lorem.sentence());
  await confirmationDialog.assert.isVisible();

  await confirmationDialog.cancelButton.click();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm.comment.fill(faker.lorem.sentence());
  await confirmationDialog.okButton.click();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'previouslyPreferredLabel',
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'modifiedPreferredLabel',
  );

  await attributionDetails.saveButton.click();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
  await attributionsPanel.packageCard.assert.modifiedPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm.comment.fill('');
  await attributionsPanel.packageCard.assert.modifiedPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'modifiedPreferredLabel',
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'previouslyPreferredLabel',
  );

  await attributionDetails.saveButton.click();
  await attributionsPanel.packageCard.assert.modifiedPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm.comment.fill(faker.lorem.sentence());
  await confirmationDialog.assert.isVisible();
});

test('resets custom license text when user selects suggested license expression', async ({
  attributionDetails,
  resourcesTree,
}) => {
  const licenseText = faker.lorem.sentences();

  await resourcesTree.goto(resourceName1);

  await attributionDetails.attributionForm.licenseTextToggleButton.click();
  await attributionDetails.attributionForm.licenseText.fill(licenseText);
  await attributionDetails.attributionForm.assert.licenseTextIs(licenseText);

  await attributionDetails.attributionForm.licenseExpression.click();
  await attributionDetails.attributionForm.selectLicense(license1);
  await attributionDetails.attributionForm.assert.licenseTextIs('');
});
