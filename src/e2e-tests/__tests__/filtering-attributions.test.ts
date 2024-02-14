// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  followUp: 'FOLLOW_UP',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  firstParty: true,
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
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.folderPath(resourceName1, resourceName2)]: [
          attributionId3,
        ],
      }),
    }),
  },
});

test('filters attributions and persists selection across attribution and report views', async ({
  attributionList,
}) => {
  await attributionList.attributionCard.assert.isVisible(packageInfo1);
  await attributionList.attributionCard.assert.isVisible(packageInfo2);
  await attributionList.attributionCard.assert.isVisible(packageInfo3);

  await attributionList.filterButton.click();
  await attributionList.filters.needsFollowUp.click();
  await attributionList.closeFilterMenu();
  await attributionList.attributionCard.assert.isVisible(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
  await attributionList.attributionCard.assert.isHidden(packageInfo3);

  await attributionList.filterButton.click();
  await attributionList.filters.firstParty.click();
  await attributionList.closeFilterMenu();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
  await attributionList.attributionCard.assert.isHidden(packageInfo3);

  await attributionList.filterButton.click();
  await attributionList.filters.needsFollowUp.click();
  await attributionList.closeFilterMenu();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
  await attributionList.attributionCard.assert.isVisible(packageInfo3);

  await attributionList.filterButton.click();
  await attributionList.filters.firstParty.click();
  await attributionList.closeFilterMenu();
  await attributionList.attributionCard.assert.isVisible(packageInfo1);
  await attributionList.attributionCard.assert.isVisible(packageInfo2);
  await attributionList.attributionCard.assert.isVisible(packageInfo3);
});
