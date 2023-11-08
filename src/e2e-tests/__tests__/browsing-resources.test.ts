// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName3]: 1,
        },
        [resourceName2]: 1,
      }),
    }),
  },
});

test('shows and hides resources as user browses through resources', async ({
  projectStatisticsPopup,
  resourceBrowser,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.assert.resourceIsVisible(resourceName1);
  await resourceBrowser.assert.resourceIsVisible(resourceName2);
  await resourceBrowser.assert.resourceIsHidden(resourceName3);
  await resourceBrowser.goto(resourceName1);
  await resourceBrowser.assert.resourceIsVisible(resourceName3);
  await resourceBrowser.goto(resourceName3);
});
