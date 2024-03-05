// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3] =
  faker.opossum.resourceNames({ count: 3 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  packageName: 'c',
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: 1,
        },
        [resourceName3]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId3],
      }),
    }),
  },
});

test('allows navigating up and down the resource tree by keyboard', async ({
  resourcesTree,
  attributionDetails,
  window,
}) => {
  await resourcesTree.goto(resourceName1);
  await resourcesTree.goto(resourceName2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await window.keyboard.press('ArrowDown');
  await window.keyboard.press('Enter');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo3,
  );

  await window.keyboard.press('ArrowUp');
  await window.keyboard.press('ArrowUp');
  await window.keyboard.press('Space');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
});

test('allows expanding and collapsing folders in the resource tree by keyboard', async ({
  resourcesTree,
  window,
}) => {
  await resourcesTree.goto(resourceName3);
  await window.keyboard.press('ArrowUp');
  await resourcesTree.assert.resourceIsHidden(resourceName2);

  await window.keyboard.press('ArrowRight');
  await resourcesTree.assert.resourceIsVisible(resourceName2);

  await window.keyboard.press('ArrowLeft');
  await resourcesTree.assert.resourceIsHidden(resourceName2);

  await window.keyboard.press('Enter');
  await resourcesTree.assert.resourceIsVisible(resourceName2);
});
