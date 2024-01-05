// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../testing/Faker';
import { test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId, packageInfo] = faker.opossum.manualAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      frequentLicenses: [license1, license2],
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId],
        [faker.opossum.filePath(resourceName2)]: [attributionId],
      }),
    }),
  },
});

test('warns user of unsaved changes if user attempts to open new file before saving', async ({
  attributionDetails,
  notSavedPopup,
  resourceBrowser,
  topBar,
}) => {
  const comment = faker.lorem.sentences();
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.comment().fill(comment);

  await topBar.openFileButton.click();
  await notSavedPopup.assert.isVisible();

  await notSavedPopup.cancelButton.click();
  await attributionDetails.assert.commentIs(comment);

  await topBar.openFileButton.click();
  await notSavedPopup.assert.isVisible();
});
