// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { faker, test } from '../utils';

const licenses = Array.from(
  { length: 100 },
  (_, index) => `Layout-License-${index.toString().padStart(3, '0')}`,
);
const firstLicense = licenses[0];
const lastLicense = licenses[licenses.length - 1];
const attributions = licenses.map((licenseName) =>
  faker.opossum.rawAttribution({
    packageName: licenseName,
    licenseName,
  }),
);
const resourceName = 'license-layout';

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: { [resourceName]: 1 },
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: Object.fromEntries(attributions),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: attributions.map(([id]) => id),
      }),
    }),
  },
});

test('keeps the license editor visible and scrolls to the first and last licenses', async ({
  resourcesTree,
  attributionsPanel,
}) => {
  await resourcesTree.goto(resourceName);
  await attributionsPanel.openLicenseEditor();
  const { licenseEditor, licenseSearch, licenseList } = attributionsPanel;

  await expect(licenseEditor).toBeInViewport({ ratio: 1 });
  await expect(licenseSearch).toBeInViewport({ ratio: 1 });

  await licenseSearch.press('ArrowDown');
  await expect(licenseList).toBeFocused();
  await attributionsPanel.assert.licenseOptionIsActiveAndInView(firstLicense);

  // End must reach an option that has not been rendered yet.
  await expect(attributionsPanel.licenseOption(lastLicense)).toHaveCount(0);
  await licenseList.press('End');
  await attributionsPanel.assert.licenseOptionIsActiveAndInView(lastLicense);

  await licenseList.press('Home');
  await attributionsPanel.assert.licenseOptionIsActiveAndInView(firstLicense);
});
