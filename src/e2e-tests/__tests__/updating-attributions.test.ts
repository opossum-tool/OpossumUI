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

test('warns user of unsaved changes if user attempts to open new file before saving', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
  topBar,
}) => {
  const comment = faker.lorem.sentences();
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.comment.fill(comment);

  await topBar.openFileButton.click();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await attributionDetails.attributionForm.assert.commentIs(comment);

  await topBar.openFileButton.click();
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
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await attributionDetails.attributionForm.comment.fill(
    faker.lorem.sentences(),
  );
  await topBar.gotoReportView();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.discardButton.click();
  await topBar.assert.reportViewIsActive();
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
  await attributionDetails.attributionForm.assert.licenseTextIsHidden();
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await attributionDetails.assert.saveButtonIsDisabled();
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

test('removes previously-preferred status from modified previously preferred attribution', async ({
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

  await attributionDetails.saveButton.click();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
});
