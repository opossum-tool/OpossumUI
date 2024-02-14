// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
  resourceName6,
] = faker.opossum.resourceNames({ count: 6 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();
const [attributionId4a, packageInfo4a] = faker.opossum.rawAttribution({
  comment: faker.lorem.sentence(),
});
const [attributionId4b, packageInfo4b] = faker.opossum.rawAttribution({
  ...packageInfo4a,
  comment: faker.lorem.sentence(),
});
const [attributionId5, packageInfo5] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: 1 },
        [resourceName3]: 1,
        [resourceName4]: 1,
        [resourceName5]: { [resourceName6]: 1 },
      }),
      attributionBreakpoints: [faker.opossum.folderPath(resourceName5)],
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId4a]: packageInfo4a,
        [attributionId4b]: packageInfo4b,
        [attributionId5]: packageInfo5,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName4)]: [
          attributionId4a,
          attributionId4b,
        ],
        [faker.opossum.folderPath(resourceName5)]: [attributionId5],
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
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [attributionId3],
      }),
    }),
  },
});

test('links unrelated attribution on resource and displays it as parent on child', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
  signalsPanel,
}) => {
  await attributionsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.assert.selectedTabIs('onChildren');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);
  await signalsPanel.packageCard.assert.isVisible(packageInfo5);

  await resourcesTree.goto(resourceName1);
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);

  await attributionsPanel.tabs.unrelated.click();
  await attributionsPanel.packageCard.click(packageInfo2);
  await attributionDetails.linkButton.click();
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);

  await resourcesTree.goto(resourceName2);
  await attributionsPanel.assert.selectedTabIs('onParents');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
});

test('links merged signal as attribution on resource', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
  signalsPanel,
}) => {
  await resourcesTree.goto(resourceName4);
  await signalsPanel.assert.selectedTabIs('onResource');
  await signalsPanel.packageCard.assert.isVisible(packageInfo4a);

  await signalsPanel.packageCard.click(packageInfo4a);
  await attributionDetails.attributionForm.assert.matchesPackageInfo({
    ...packageInfo4a,
    comment: `${packageInfo4a.comment}\n\n${packageInfo4b.comment}`,
  });
  await attributionsPanel.packageCard.assert.isHidden(packageInfo4a);

  await attributionDetails.linkButton.click();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo4a);
  await attributionDetails.attributionForm.assert.matchesPackageInfo({
    ...packageInfo4a,
    comment: `${packageInfo4a.comment}\n\n${packageInfo4b.comment}`,
  });
});

test('links multiple attributions on resource at once', async ({
  resourcesTree,
  attributionsPanel,
  attributionDetails,
}) => {
  await resourcesTree.goto(resourceName4);
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo3,
  );
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo2);

  await attributionsPanel.tabs.unrelated.click();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);

  await attributionsPanel.packageCard.checkbox(packageInfo1).check();
  await attributionsPanel.packageCard.checkbox(packageInfo2).check();
  await attributionsPanel.linkButton.click();
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo3,
  );
});

test('links multiple signals on resource at once', async ({
  signalsPanel,
  attributionsPanel,
}) => {
  await attributionsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.packageCard.assert.isVisible(packageInfo4a);
  await signalsPanel.packageCard.assert.isVisible(packageInfo5);

  await signalsPanel.packageCard.checkbox(packageInfo4a).check();
  await signalsPanel.packageCard.checkbox(packageInfo5).check();
  await signalsPanel.linkButton.click();
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo4a);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo5);
});

test('allows user to override parent attributions', async ({
  attributionDetails,
  resourcesTree,
  attributionsPanel,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionsPanel.assert.tabIsHidden('onParents');

  await resourcesTree.goto(resourceName2);
  await attributionsPanel.assert.tabIsVisible('onParents');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );

  await attributionsPanel.tabs.unrelated.click();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo3);

  await attributionsPanel.packageCard.click(packageInfo2);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );

  await attributionsPanel.linkButton.click();
  await attributionsPanel.assert.tabIsHidden('onParents');
  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.packageCard.assert.isVisible(packageInfo2);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);
  await attributionsPanel.packageCard.assert.isHidden(packageInfo3);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo2,
  );
});

test('disables resp. hides options to create or link attributions to breakpoints', async ({
  attributionDetails,
  attributionsPanel,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName5);
  await attributionsPanel.assert.tabIsVisible('unrelated');

  await attributionsPanel.packageCard.click(packageInfo1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    packageInfo1,
  );
  await attributionsPanel.assert.createButtonIsDisabled();
  await attributionsPanel.assert.linkButtonIsDisabled();
  await attributionDetails.assert.linkButtonIsHidden();
});
