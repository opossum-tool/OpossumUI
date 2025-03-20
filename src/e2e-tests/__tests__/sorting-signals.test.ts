// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
  classification: 0,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
  classification: 1,
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

test('sorting signals by classification', async ({ signalsPanel }) => {
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);

  await signalsPanel.packageCard.assert.signalAboveSecondSignal(
    packageInfo1,
    packageInfo2,
  );

  await signalsPanel.sortButton.click();
  await signalsPanel.sortings.classification.click();
  await signalsPanel.closeMenu();

  await signalsPanel.packageCard.assert.signalAboveSecondSignal(
    packageInfo2,
    packageInfo1,
  );
});
