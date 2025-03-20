// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../testing/Faker';
import { test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
  classification: 0,
  criticality: 'medium',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
  classification: 1,
  criticality: 'high',
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: {
            [resourceName3]: 1,
          },
        },
        [resourceName4]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
      }),
    }),
  },
});

test('shows classification and criticality in statistics popup only if selected', async ({
  menuBar,
  projectStatisticsPopup,
}) => {
  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.assert.titleIsVisible();
  // hover on title to avoid getting tooltips that mess up locators
  await projectStatisticsPopup.title.hover();

  await projectStatisticsPopup.assert.signalsByCriticalityIsVisible();
  await projectStatisticsPopup.assert.signalsByClassificationIsShown();

  await menuBar.toggleShowClassificationOff();

  await projectStatisticsPopup.assert.signalsByCriticalityIsVisible();
  await projectStatisticsPopup.assert.signalsByClassificationIsNotShown();

  await menuBar.toggleShowCriticalityOff();

  await projectStatisticsPopup.assert.signalsByCriticalityIsNotVisible();
  await projectStatisticsPopup.assert.signalsByClassificationIsNotShown();
});
