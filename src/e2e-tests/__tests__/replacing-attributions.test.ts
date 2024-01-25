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
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  attributionConfidence: DiscreteConfidence.High,
});
const [attributionId3, packageInfo3] = faker.opossum.manualAttribution({
  preSelected: true,
});

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
    }),
    outputData: faker.opossum.outputData({
      metadata,
      manualAttributions: faker.opossum.manualAttributions({
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

test('replaces attributions in attribution view', async ({
  attributionDetails,
  attributionList,
  replaceAttributionsPopup,
  resourceBrowser,
  topBar,
}) => {
  await topBar.gotoAttributionView();
  await resourceBrowser.assert.isHidden();

  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await resourceBrowser.assert.resourceIsVisible(resourceName3);
  await resourceBrowser.assert.resourceIsHidden(resourceName4);

  await attributionList.attributionCard.checkbox(packageInfo1).click();
  await attributionList.replaceButton.click();
  await replaceAttributionsPopup.assert.isVisible();
  await replaceAttributionsPopup.assert.replaceButtonIsDisabled();

  await replaceAttributionsPopup.searchInput.fill(packageInfo2.packageName!);
  await replaceAttributionsPopup.attributionCard.click(packageInfo2);
  await replaceAttributionsPopup.assert.replaceButtonIsEnabled();

  await replaceAttributionsPopup.replace();
  await attributionList.attributionCard.assert.isHidden(packageInfo1);

  await attributionList.attributionCard.click(packageInfo2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );
  await resourceBrowser.assert.resourceIsVisible(resourceName3);
  await resourceBrowser.assert.resourceIsVisible(resourceName4);
});
