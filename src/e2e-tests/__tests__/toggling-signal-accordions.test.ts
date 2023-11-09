// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName = faker.opossum.resourceName();
const [attributionId, packageInfo] = faker.opossum.externalAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: [attributionId],
      }),
    }),
  },
});

test('displays and hides signals when user expands/collapses accordion', async ({
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName);
  await resourceDetails.signalCard.assert.isVisible(packageInfo);
  await resourceDetails.signalsAccordion.click();
  await resourceDetails.signalCard.assert.isHidden(packageInfo);
});
