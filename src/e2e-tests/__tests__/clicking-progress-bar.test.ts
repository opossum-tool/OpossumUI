// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../shared/shared-types';
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  criticality: Criticality.High,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId2],
      }),
    }),
  },
});

test('click on regular progress bar goes to next resource with non-inherited external attributions only', async ({
  signalsPanel,
  topBar,
}) => {
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
});

test('click on criticality progress bar goes to next resource with a critical attribution', async ({
  signalsPanel,
  topBar,
}) => {
  await topBar.switchBar.click();
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
});
