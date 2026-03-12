// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import type { RawPackageInfo } from '../../shared/shared-types';
import { faker, test } from '../utils';

const [resourceName] = faker.opossum.resourceNames({
  count: 1,
});
const license1 = faker.opossum.license({
  shortName: 'Apache-2.0',
  fullName: 'Apache License 2.0',
});
const license2 = faker.opossum.license({
  shortName: 'MIT',
  fullName: 'MIT License',
});
const license3 = faker.opossum.license({
  shortName: 'GPL-3.0',
  fullName: 'GNU General Public License v3.0',
});
const license4 = faker.opossum.license({
  shortName: 'BSD-3-Clause',
  fullName: 'BSD 3-Clause License',
});
const licenses = [license1, license2, license3, license4];
const attributionIds: Array<string> = [];
const packageInfos: Array<RawPackageInfo> = [];

// Generate attributions for each license (1 for license1, 2 for license2, 3 for license3, 4 for license4)
for (let i = 0; i < 10; i++) {
  let license;
  if (i < 1) {
    license = licenses[0];
  } else if (i < 3) {
    license = licenses[1];
  } else if (i < 6) {
    license = licenses[2];
  } else {
    license = licenses[3];
  }
  const [attributionId, packageInfo] = faker.opossum.rawAttribution({
    licenseName: license.shortName,
  });
  attributionIds.push(attributionId);
  packageInfos.push(packageInfo);
}

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      frequentLicenses: licenses,
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        ...Object.fromEntries(
          attributionIds.map((id, index) => [id, packageInfos[index]]),
        ),
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: attributionIds,
      }),
    }),
  },
});

test('license autocomplete sorts common licenses by number of occurrences', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
}) => {
  const newPackageInfo = faker.opossum.rawPackageInfo({
    attributionConfidence: undefined,
    licenseName: license1.shortName,
  });
  await resourcesTree.goto(resourceName);
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

  await attributionDetails.attributionForm.licenseExpression.click();

  const autocompleteOptions =
    await attributionDetails.attributionForm.getLicenseAutocompleteOptions();
  const optionTexts = await Promise.all(
    autocompleteOptions.map((option) => option.textContent()),
  );
  expect(optionTexts[1]).toEqual(
    'Common Licenses4BSD-3-ClauseBSD 3-Clause License3GPL-3.0GNU General Public License v3.02MITMIT License1Apache-2.0Apache License 2.0',
  );

  await attributionDetails.attributionForm.selectLicense(license1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    newPackageInfo,
  );
});
