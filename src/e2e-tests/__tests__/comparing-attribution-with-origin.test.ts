// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId1, manualPackageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, manualPackageInfo2] = faker.opossum.rawAttribution({
  originIds: [faker.string.uuid()],
  licenseText: faker.opossum.license().defaultText,
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

test('enables comparing attribution to origin if origin is present', async ({
  attributionDetails,
  diffPopup,
  resourceBrowser,
}) => {
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.compareButtonIsHidden();

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.compareButtonIsEnabled();

  await attributionDetails.compareButton.click();
  await diffPopup.assert.isVisible();

  await diffPopup.originalAttributionForm.assert.matchesPackageInfo(
    externalPackageInfo,
  );
  await diffPopup.currentAttributionForm.assert.matchesPackageInfo(
    manualPackageInfo2,
  );
});
