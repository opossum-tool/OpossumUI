// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionType } from '../../Frontend/enums/enums';
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
  licenseText: faker.opossum.license().defaultText,
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

test('opens the diff popup if attribution has original and compare button is clicked', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.assert.compareButtonIsHidden();

  await resourcesTree.goto(resourceName2);
  await attributionDetails.assert.compareButtonIsVisible();

  await attributionDetails.compareButton.click();
  await diffPopup.assert.isVisible();
});

test('reverts all changes and applies reverted state to temporary package info', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName2);
  const newPackageName = faker.lorem.word();
  await attributionDetails.attributionForm.name.fill(newPackageName);
  await attributionDetails.attributionForm.selectAttributionType(
    AttributionType.FirstParty,
  );
  await attributionDetails.compareButton.click();
  await diffPopup.currentAttributionForm.assert.nameIs(newPackageName);
  await diffPopup.currentAttributionForm.assert.attributionTypeIs(
    AttributionType.FirstParty,
  );
  await diffPopup.currentAttributionForm.assert.copyrightIs('');
  await diffPopup.currentAttributionForm.assert.licenseTextIsVisible();
  await diffPopup.currentAttributionForm.assert.licenseTextIs('');
  await diffPopup.currentAttributionForm.assert.licenseNameIs('');
  await diffPopup.currentAttributionForm.assert.nameUndoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.nameRedoButtonIsHidden();
  await diffPopup.currentAttributionForm.assert.attributionTypeUndoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.attributionTypeRedoButtonIsHidden();
  await diffPopup.currentAttributionForm.assert.copyrightUndoButtonIsHidden();
  await diffPopup.currentAttributionForm.assert.copyrightRedoButtonIsHidden();

  await diffPopup.assert.applyButtonIsDisabled();
  await diffPopup.revertAllButton.click();
  await diffPopup.applyButton.click();
  await diffPopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo2,
  );
});

test('reverts single fields correctly', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName2);
  const newPackageName = faker.lorem.word();
  await attributionDetails.attributionForm.name.fill(newPackageName);
  const newCopyright = faker.lorem.sentence();
  await attributionDetails.attributionForm.copyright.fill(newCopyright);
  await attributionDetails.compareButton.click();
  await diffPopup.currentAttributionForm.assert.nameIs(newPackageName);
  await diffPopup.currentAttributionForm.assert.nameUndoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.nameRedoButtonIsHidden();
  await diffPopup.currentAttributionForm.assert.copyrightIs(newCopyright);
  await diffPopup.currentAttributionForm.assert.copyrightUndoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.copyrightRedoButtonIsHidden();

  await diffPopup.currentAttributionForm.nameUndoButton.click();
  await diffPopup.currentAttributionForm.assert.nameRedoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.nameUndoButtonIsHidden();
  await diffPopup.currentAttributionForm.assert.nameIs(packageName);

  await diffPopup.currentAttributionForm.nameRedoButton.click();
  await diffPopup.currentAttributionForm.assert.nameIs(newPackageName);

  await diffPopup.currentAttributionForm.copyrightUndoButton.click();
  await diffPopup.currentAttributionForm.assert.copyrightIs(copyright);
  await diffPopup.currentAttributionForm.assert.copyrightRedoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.copyrightUndoButtonIsHidden();

  await diffPopup.revertAllButton.click();
  await diffPopup.applyButton.click();
  await diffPopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo2,
  );
});

test('handles pending license and copyright changes in temporary package info correctly', async ({
  attributionDetails,
  diffPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName2);
  const newPackageName = faker.lorem.word();
  await attributionDetails.attributionForm.name.fill(newPackageName);
  await attributionDetails.attributionForm.selectAttributionType(
    AttributionType.FirstParty,
  );
  await attributionDetails.compareButton.click();
  await diffPopup.currentAttributionForm.assert.nameIs(newPackageName);
  await diffPopup.currentAttributionForm.assert.attributionTypeIs(
    AttributionType.FirstParty,
  );
  await diffPopup.currentAttributionForm.assert.nameUndoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.attributionTypeUndoButtonIsVisible();
  await diffPopup.assert.applyButtonIsDisabled();

  await diffPopup.currentAttributionForm.nameUndoButton.click();
  await diffPopup.currentAttributionForm.assert.nameRedoButtonIsVisible();

  await diffPopup.currentAttributionForm.attributionTypeUndoButton.click();
  await diffPopup.currentAttributionForm.assert.attributionTypeRedoButtonIsVisible();
  await diffPopup.currentAttributionForm.assert.attributionTypeUndoButtonIsHidden();
  await diffPopup.assert.revertAllButtonIsDisabled();

  await diffPopup.currentAttributionForm.attributionTypeRedoButton.click();
  await diffPopup.applyButton.click();
  await attributionDetails.attributionForm.assert.licenseTextIsHidden();

  await attributionDetails.attributionForm.selectAttributionType(
    AttributionType.ThirdParty,
  );
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo2,
  );
});
