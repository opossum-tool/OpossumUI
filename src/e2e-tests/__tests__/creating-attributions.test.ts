// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3] =
  faker.opossum.resourceNames({ count: 3 });
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
        [resourceName3]: 1,
      }),
      frequentLicenses: [license1, license2],
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
      }),
    }),
  },
});

test('creates a new third-party attribution', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
  attributionsPanel,
}) => {
  const newPackageInfo = faker.opossum.rawPackageInfo({
    attributionConfidence: undefined,
    licenseName: license1.fullName,
  });
  await resourcesTree.goto(resourceName1);
  await attributionsPanel.createButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();

  await attributionDetails.attributionForm.name.fill(
    newPackageInfo.packageName!,
  );
  await attributionDetails.attributionForm.type.fill(
    newPackageInfo.packageType!,
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

  await resourcesTree.goto(resourceName2);
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionsPanel.packageCard.assert.isVisible(newPackageInfo);
});

test('creates a new first-party attribution', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
}) => {
  const newPackageInfo = faker.opossum.rawPackageInfo({
    attributionConfidence: undefined,
    copyright: undefined,
    firstParty: true,
    licenseName: undefined,
    packageName: undefined,
    packageType: undefined,
    packageVersion: undefined,
    url: undefined,
  });
  await resourcesTree.goto(resourceName1);
  await attributionsPanel.createButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();

  await attributionDetails.attributionForm.selectAttributionType('First Party');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    newPackageInfo,
  );
  await attributionDetails.assert.saveButtonIsEnabled();

  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionsPanel.packageCard.assert.isVisible(newPackageInfo);
});
