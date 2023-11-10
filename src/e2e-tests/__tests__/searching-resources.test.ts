// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId, packageInfo] = faker.opossum.manualAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: 1,
        },
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2)]: [attributionId],
      }),
    }),
  },
});

test('opens resource search popup which closes and displays resource details when user clicks on a hit', async ({
  attributionDetails,
  fileSearchPopup,
  menuBar,
  projectStatisticsPopup,
}) => {
  await projectStatisticsPopup.close();
  await menuBar.searchForFilesAndDirectories();
  await fileSearchPopup.assert.titleIsVisible();

  await fileSearchPopup.close();
  await fileSearchPopup.assert.titleIsHidden();

  await menuBar.searchForFilesAndDirectories();
  await fileSearchPopup.searchInput.fill(resourceName2);
  await fileSearchPopup.assert.resourcePathIsVisible(
    resourceName1,
    resourceName2,
  );

  await fileSearchPopup.gotoHit(resourceName1, resourceName2);
  await attributionDetails.assert.matchesPackageInfo(packageInfo);
});
