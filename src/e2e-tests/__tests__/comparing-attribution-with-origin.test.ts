// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { text } from '../../shared/text';
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const packageName = faker.lorem.word();
const copyright = faker.lorem.sentence();
const [attributionId1, manualPackageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, manualPackageInfo2] = faker.opossum.rawAttribution({
  originIds: [faker.string.uuid()],
  packageName,
  copyright,
  licenseName: 'MIT',
  licenseText: 'MIT License',
  firstParty: false,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution(manualPackageInfo2);

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName2)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: manualPackageInfo1,
        [attributionId2]: manualPackageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId2],
      }),
    }),
  },
});

test('opens the diff popup with the original signal and current draft', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.assert.compareButtonIsHidden();

  await resourcesTree.goto(resourceName2);
  await attributionDetails.compareButton.click();
  await diffPopup.assert.isVisible();
  await diffPopup.assert.leftPackageNameIs(
    externalPackageInfo.packageName || '',
  );
  await diffPopup.assert.rightPackageNameIs(packageName);
  await diffPopup.assert.leftTitleIs(text.attributionColumn.original);
  await diffPopup.assert.rightTitleIs(text.attributionColumn.current);
});

test('preserves legal data when restoring the comparison attribution type', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  const changedPackageName = 'legal-data-preservation-edit';

  await resourcesTree.goto(resourceName2);
  await attributionDetails.compareButton.click();
  await diffPopup.rightPackageName.fill(changedPackageName);
  await diffPopup.expandLicenseText('right');
  await diffPopup.selectAttributionType('right', 'First Party');
  await diffPopup.assert.legalFieldsAreHidden('right');

  await diffPopup.restoreAttributionType(
    'right',
    'Third Party',
    text.attributionColumn.current,
  );
  await diffPopup.assert.attributionTypeIs('right', 'Third Party');
  await diffPopup.assert.legalFieldIs('right', 'copyright', copyright);
  await diffPopup.assert.legalFieldIs('right', 'licenseName', 'MIT');
  await diffPopup.assert.legalFieldIs('right', 'licenseText', 'MIT License');

  await diffPopup.saveButton.click();
  await diffPopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.nameIs(changedPackageName);
  await attributionDetails.attributionForm.assert.attributionTypeIs(
    'Third Party',
  );
  await attributionDetails.attributionForm.assert.copyrightIs(copyright);
  await attributionDetails.attributionForm.assert.licenseNameIs('MIT');
  await expect(attributionDetails.attributionForm.licenseText).toBeHidden();
  await attributionDetails.attributionForm.licenseTextToggleButton.click();
  await attributionDetails.attributionForm.assert.licenseTextIs('MIT License');
  await attributionDetails.assert.saveButtonIsDisabled();
});

test('edits stay local and closing the popup discards them', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName2);
  await attributionDetails.compareButton.click();
  await diffPopup.rightPackageName.fill('popup-only-edit');
  await diffPopup.assert.rightPackageNameIsDirty();
  await diffPopup.cancelButton.click();
  await diffPopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.nameIs(packageName);
});

test('preexisting attribution edits are visible when comparison opens', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName2);
  const newPackageName = faker.lorem.word();
  await attributionDetails.attributionForm.name.fill(newPackageName);
  await attributionDetails.compareButton.click();
  await diffPopup.assert.rightPackageNameIs(newPackageName);
});

test('restores an unsaved details edit through comparison', async ({
  attributionDetails,
  diffPopup,
  notSavedPopup,
  resourcesTree,
}) => {
  const unsavedPackageName = 'unsaved-comparison-edit';

  await resourcesTree.goto(resourceName2);
  await attributionDetails.attributionForm.name.fill(unsavedPackageName);
  await attributionDetails.compareButton.click();
  await diffPopup.assert.rightPackageNameIs(unsavedPackageName);

  await diffPopup.rightPackageName.fill(packageName);
  await expect(diffPopup.saveButton).toBeEnabled();
  await diffPopup.saveButton.click();
  await diffPopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.nameIs(packageName);
  await attributionDetails.assert.saveButtonIsDisabled();

  await resourcesTree.goto(resourceName1);
  await notSavedPopup.assert.isHidden();
  await resourcesTree.goto(resourceName2);
  await notSavedPopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.nameIs(packageName);
});
