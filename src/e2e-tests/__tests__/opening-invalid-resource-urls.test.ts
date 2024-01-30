// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3] =
  faker.opossum.resourceNames({ count: 3 });
const [attributionId, packageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName3]: 1,
        },
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
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
  errorPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.goto(resourceName1, resourceName3);
  await resourceDetails.assert.breadcrumbsAreVisible(
    resourceName1,
    resourceName3,
  );
  await resourceDetails.assert.openResourceUrlButtonIsEnabled();

  await resourceDetails.openResourceUrl();
  await errorPopup.assert.isVisible();
  await errorPopup.assert.errorMessageIsVisible('Cannot open link.');

  await errorPopup.close();
  await errorPopup.assert.isHidden();

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.assert.openResourceUrlButtonIsDisabled();
});
