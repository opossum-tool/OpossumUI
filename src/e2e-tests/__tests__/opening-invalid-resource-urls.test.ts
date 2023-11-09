// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const [attributionId, packageInfo] = faker.opossum.externalAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName3]: 1,
        },
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName2)]: [attributionId],
      }),
      baseUrlsForSources: {
        [faker.opossum.folderPath(resourceName1)]: 'invalid/link',
      },
    }),
  },
});

test('displays an error if user attempts to open invalid resource URL', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  errorPopup,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await resourceBrowser.goto(resourceName3);

  await resourceDetails.assert.resourcePathIsVisible(
    resourceName1,
    resourceName3,
  );
  await resourceDetails.openResourceUrl();

  await errorPopup.assert.titleIsVisible();
  await errorPopup.assert.errorMessageIsVisible('Cannot open link.');
  await errorPopup.close();
  await errorPopup.assert.titleIsHidden();
});
