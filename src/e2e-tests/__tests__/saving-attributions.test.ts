// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { expect, faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  packageType: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  packageType: undefined,
});
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();

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

test('adds a new attribution', async ({
  projectStatisticsPopup,
  resourceBrowser,
  attributionDetails,
  resourceDetails,
  window,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    attributionConfidence: DiscreteConfidence.High,
    licenseName: license1.shortName,
    packageType: undefined,
  });
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.addNewAttributionButton.click({ button: 'right' });
  await expect(window.getByRole('menu')).toBeHidden(); // add new attribution button has no context menu
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  await resourceDetails.addNewAttributionButton.click();
  await attributionDetails.assert.isEmpty();

  await attributionDetails.name.fill(newPackageInfo.packageName!);
  await attributionDetails.version.fill(newPackageInfo.packageVersion!);
  await attributionDetails.url.fill(newPackageInfo.url!);
  await attributionDetails.copyright.fill(newPackageInfo.copyright!);
  await attributionDetails.licenseName.click();
  await attributionDetails.selectLicense(license1);
  await attributionDetails.assert.matchPackageInfo(newPackageInfo);

  await attributionDetails.saveButton.click();
  await attributionDetails.assert.saveButtonIsDisabled();
  await resourceDetails.attributionCard.assert.isVisible(newPackageInfo);
});

test('allows user to edit an existing attribution locally and globally', async ({
  projectStatisticsPopup,
  resourceBrowser,
  attributionDetails,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo1.attributionConfidence,
    packageType: undefined,
  });
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.licenseTextIsHidden();
  await attributionDetails.assert.matchPackageInfo(packageInfo1);
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
  await attributionDetails.comment.fill(newPackageInfo.comment!);
  await attributionDetails.assert.matchPackageInfo(newPackageInfo);
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
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  const newPackageName = faker.internet.domainWord();
  await resourceBrowser.goto(resourceName3);
  await attributionDetails.name.fill(newPackageName);
  await attributionDetails.saveGloballyButton.click();

  await resourceBrowser.goto(resourceName4);
  await attributionDetails.assert.nameIs(newPackageName);
});
