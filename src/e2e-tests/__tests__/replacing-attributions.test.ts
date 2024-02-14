// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { faker, test } from '../utils';

const metadata = faker.opossum.metadata();
const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  attributionConfidence: DiscreteConfidence.High,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  preSelected: true,
});
const [attributionId4, packageInfo4] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      metadata,
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: { [resourceName3]: 1, [resourceName4]: 1 },
        },
        [resourceName5]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId4]: packageInfo4,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId4,
        ],
      }),
    }),
    outputData: faker.opossum.outputData({
      metadata,
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName4)]: [
          attributionId2,
          attributionId3,
        ],
      }),
    }),
  },
});

test('replaces an attribution with another', async ({
  attributionDetails,
  attributionsPanel,
  replaceAttributionsPopup,
  linkedResourcesTree,
}) => {
  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await linkedResourcesTree.assert.resourceIsHidden(resourceName4);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);
  await attributionDetails.assert.saveButtonIsVisible();
  await attributionDetails.assert.replaceButtonIsHidden();

  await attributionsPanel.replaceButton.click();
  await attributionDetails.assert.saveButtonIsHidden();
  await attributionDetails.assert.replaceButtonIsHidden();

  await attributionsPanel.packageCard.click(packageInfo2);
  await linkedResourcesTree.assert.resourceIsHidden(resourceName3);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName4);
  await attributionDetails.assert.replaceButtonIsVisible();

  await attributionDetails.replaceButton.click();
  await replaceAttributionsPopup.assert.isVisible();

  await replaceAttributionsPopup.replaceButton.click();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);

  await attributionsPanel.packageCard.click(packageInfo2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName4);
});

test('replaces multiple attributions with another', async ({
  attributionDetails,
  attributionsPanel,
  replaceAttributionsPopup,
  linkedResourcesTree,
}) => {
  await attributionsPanel.packageCard.checkbox(packageInfo2).check();
  await attributionsPanel.packageCard.checkbox(packageInfo3).check();

  await attributionsPanel.replaceButton.click();
  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionDetails.assert.replaceButtonIsVisible();

  await attributionDetails.replaceButton.click();
  await replaceAttributionsPopup.assert.isVisible();
  await replaceAttributionsPopup.assert.hasText('2 attributions');

  await replaceAttributionsPopup.replaceButton.click();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo3);

  await attributionsPanel.packageCard.click(packageInfo1);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName3);
  await linkedResourcesTree.assert.resourceIsVisible(resourceName4);
});

test('exits replacement mode when user tries to select a signal as replacement', async ({
  attributionDetails,
  attributionsPanel,
  signalsPanel,
}) => {
  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionsPanel.replaceButton.click();
  await attributionDetails.assert.saveButtonIsHidden();
  await attributionDetails.assert.replaceButtonIsHidden();

  await signalsPanel.packageCard.click(packageInfo4);
  await attributionDetails.assert.linkButtonIsVisible();
  await attributionDetails.assert.replaceButtonIsHidden();
});
