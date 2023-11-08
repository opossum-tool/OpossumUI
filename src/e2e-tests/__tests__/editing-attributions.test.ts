// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName = faker.opossum.resourceName();
const [attributionId, packageInfo] = faker.opossum.manualAttribution({
  packageType: undefined,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: [attributionId],
      }),
    }),
  },
});

test('allows user to edit an existing attribution', async ({
  projectStatisticsPopup,
  resourceBrowser,
  attributionDetails,
}) => {
  const newPackageInfo = faker.opossum.manualPackageInfo({
    comment: faker.lorem.sentences(),
    licenseText: faker.lorem.sentences(),
    attributionConfidence: packageInfo.attributionConfidence,
    packageType: undefined,
  });
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName);
  await attributionDetails.assert.matchPackageInfo(packageInfo);
  await attributionDetails.assert.licenseTextIsHidden();

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
});
