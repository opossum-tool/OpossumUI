// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution();
const [manualAttributionId1, manualPackageInfo1] =
  faker.opossum.rawAttribution();
const [manualAttributionId2, manualPackageInfo2] =
  faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: 1,
        },
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [manualAttributionId1]: manualPackageInfo1,
        [manualAttributionId2]: manualPackageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [manualAttributionId1],
        [faker.opossum.filePath(resourceName3)]: [manualAttributionId2],
        [faker.opossum.filePath(resourceName4)]: [manualAttributionId1],
      }),
    }),
  },
});

test('shows resources linked to an attribution', async ({
  resourcesTree,
  signalsPanel,
  linkedResourcesTree,
  pathBar,
}) => {
  await resourcesTree.gotoRoot();
  await signalsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.packageCard.assert.isVisible(externalPackageInfo);
  await linkedResourcesTree.assert.isHidden();

  await signalsPanel.packageCard.click(externalPackageInfo);
  await linkedResourcesTree.assert.isVisible();
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);

  await linkedResourcesTree.goto(resourceName1);
  await pathBar.assert.breadcrumbsAreVisible(resourceName1);
  await signalsPanel.assert.selectedTabIs('onResource');
  await signalsPanel.packageCard.assert.isVisible(externalPackageInfo);
});

test('shows only resources matching search', async ({
  resourcesTree,
  linkedResourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await linkedResourcesTree.assert.isVisible();
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName4);

  await linkedResourcesTree.searchField.fill(resourceName4);
  await linkedResourcesTree.assert.resourceIsHidden(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName4);

  await linkedResourcesTree.clearSearchButton.click();
  await linkedResourcesTree.assert.resourceIsVisible(resourceName1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName4);
});
