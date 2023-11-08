// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  preSelected: true,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  preSelected: true,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId1],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
      }),
    }),
  },
});

test('deletes multiple attributions at once in attribution view', async ({
  attributionList,
  confirmationPopup,
  projectStatisticsPopup,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await topBar.gotoAttributionView();
  await attributionList.attributionCard.assert.checkboxIsUnchecked(
    packageInfo1,
  );
  await attributionList.attributionCard.assert.checkboxIsUnchecked(
    packageInfo2,
  );

  await attributionList.attributionCard.checkbox(packageInfo1).click();
  await attributionList.attributionCard.checkbox(packageInfo2).click();
  await attributionList.attributionCard.assert.checkboxIsChecked(packageInfo1);
  await attributionList.attributionCard.assert.checkboxIsChecked(packageInfo2);

  await attributionList.attributionCard.openContextMenu(packageInfo1);
  await attributionList.attributionCard.contextMenu.deleteSelectedGloballyButton.click();
  await confirmationPopup.assert.hasText('2');

  await confirmationPopup.confirm();
  await confirmationPopup.assert.isHidden();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);
  await attributionList.attributionCard.assert.isHidden(packageInfo2);
});
