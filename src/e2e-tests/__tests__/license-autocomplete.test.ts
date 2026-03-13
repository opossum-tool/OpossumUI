// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import type { RawPackageInfo } from '../../shared/shared-types';
import { faker, test } from '../utils';

const resourceName = faker.opossum.resourceName();
const licenses = faker.opossum.licenses({ count: 4 });
const occurrenceCounts = [
  { attributions: 4, signals: 5 },
  { attributions: 3, signals: 2 },
  { attributions: 2, signals: 0 },
  { attributions: 0, signals: 1 },
]; // sum of occurences per license must be decreasing, otherwise the test fails

const attributionItems: Array<{ id: string; packageInfo: RawPackageInfo }> = [];

const signalItems: Array<{ id: string; packageInfo: RawPackageInfo }> = [];

for (const [licenseIndex, occurrenceCount] of occurrenceCounts.entries()) {
  const license = licenses[licenseIndex];
  for (let i = 0; i < occurrenceCount.attributions; i++) {
    const [Id, packageInfo] = faker.opossum.rawAttribution({
      licenseName: license.shortName,
    });
    attributionItems.push({ id: Id, packageInfo });
  }
  for (let i = 0; i < occurrenceCount.signals; i++) {
    const [Id, packageInfo] = faker.opossum.rawAttribution({
      licenseName: license.shortName,
    });
    signalItems.push({ id: Id, packageInfo });
  }
}

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      frequentLicenses: licenses,
      externalAttributions: faker.opossum.rawAttributions(
        Object.fromEntries(
          signalItems.map(({ id, packageInfo }) => [id, packageInfo]),
        ),
      ),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: signalItems.map(({ id }) => id),
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions(
        Object.fromEntries(
          attributionItems.map(({ id, packageInfo }) => [id, packageInfo]),
        ),
      ),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: attributionItems.map(
          ({ id }) => id,
        ),
      }),
    }),
  },
});

test('license autocomplete sorts common licenses by number of occurrences', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
}) => {
  await resourcesTree.goto(resourceName);
  await attributionsPanel.createButton.click();
  await attributionDetails.attributionForm.assert.isEmpty();

  await attributionDetails.attributionForm.licenseExpression.click();

  for (let i = 0; i < licenses.length; i++) {
    const autocompleteOption =
      attributionDetails.attributionForm.getNthLicenseAutocompleteOption(i);
    await expect(autocompleteOption).toContainText(licenses[i].shortName);
    await expect(autocompleteOption).toContainText(licenses[i].fullName);

    const { attributions: attributionCount, signals: signalCount } =
      occurrenceCounts[i];
    const occurrenceText = autocompleteOption.getByText(
      String(attributionCount + signalCount),
    );
    await occurrenceText.first().hover();
    await attributionDetails.attributionForm.ensureLicenseOccurenceTooltipIsCorrect(
      attributionCount,
      signalCount,
    );
  }

  await attributionDetails.attributionForm.selectLicense(licenses[0]);
  await attributionDetails.attributionForm.assert.licenseNameIs(
    licenses[0].shortName,
  );
});
