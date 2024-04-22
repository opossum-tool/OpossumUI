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
  resourceName7,
] = faker.opossum.resourceNames({ count: 7 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: { [resourceName3]: 1 } },
        [resourceName4]: { [resourceName5]: { [resourceName6]: 1 } },
        [resourceName7]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4, resourceName5, resourceName6)]: [
          attributionId2,
        ],
        [faker.opossum.filePath(resourceName7)]: [attributionId3],
      }),
    }),
  },
});

test('shows expected resources as user browses through resources', async ({
  resourcesTree,
}) => {
  await resourcesTree.assert.resourceIsVisible(resourceName1);
  await resourcesTree.assert.resourceIsVisible(resourceName4);
  await resourcesTree.assert.resourceIsVisible(resourceName7);
  await resourcesTree.assert.resourceIsHidden(resourceName2);
  await resourcesTree.assert.resourceIsHidden(resourceName3);
  await resourcesTree.assert.resourceIsHidden(resourceName5);
  await resourcesTree.assert.resourceIsHidden(resourceName6);

  await resourcesTree.goto(resourceName4);
  await resourcesTree.assert.resourceIsVisible(resourceName5);
  await resourcesTree.assert.resourceIsVisible(resourceName6);
  await resourcesTree.assert.resourceIsHidden(resourceName2);
  await resourcesTree.assert.resourceIsHidden(resourceName3);
});

test('cycles through resources as user clicks on progress bar', async ({
  signalsPanel,
  topBar,
}) => {
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.click(packageInfo1);

  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.click(packageInfo2);

  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);
  await signalsPanel.packageCard.click(packageInfo3);

  await signalsPanel.linkButton.click();
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.click(packageInfo1);

  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.click(packageInfo2);

  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
});

test('cycles through resources as user clicks on jump button next to progress bar', async ({
  signalsPanel,
  topBar,
}) => {
  await topBar.jumpButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.click(packageInfo1);

  await topBar.jumpButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.click(packageInfo2);

  await topBar.jumpButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo3);
  await signalsPanel.packageCard.click(packageInfo3);

  await signalsPanel.linkButton.click();
  await topBar.jumpButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
  await signalsPanel.packageCard.click(packageInfo1);

  await topBar.jumpButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo2);
  await signalsPanel.packageCard.click(packageInfo2);

  await topBar.jumpButton.click();
  await signalsPanel.packageCard.assert.isVisible(packageInfo1);
});

test('shows expected breadcrumbs as user navigates through browser history', async ({
  modKey,
  resourcesTree,
  pathBar,
  window,
}) => {
  await resourcesTree.gotoRoot();
  await pathBar.assert.goBackButtonIsDisabled();
  await pathBar.assert.goForwardButtonIsDisabled();

  await resourcesTree.goto(resourceName1, resourceName2, resourceName3);
  await pathBar.assert.goBackButtonIsEnabled();
  await pathBar.assert.goForwardButtonIsDisabled();
  await pathBar.assert.breadcrumbsAreVisible(
    resourceName1,
    resourceName2,
    resourceName3,
  );

  await pathBar.goBackButton.click();
  await pathBar.assert.goForwardButtonIsEnabled();
  await pathBar.assert.breadcrumbsAreVisible(resourceName1, resourceName2);
  await pathBar.assert.breadcrumbsAreHidden(resourceName3);

  await pathBar.goForwardButton.click();
  await pathBar.assert.breadcrumbsAreVisible(
    resourceName1,
    resourceName2,
    resourceName3,
  );

  await pathBar.clickOnBreadcrumb(resourceName1);
  await pathBar.assert.breadcrumbsAreVisible(resourceName1);
  await pathBar.assert.breadcrumbsAreHidden(resourceName2, resourceName3);

  await window.keyboard.press(`${modKey}+ArrowLeft`);
  await pathBar.assert.breadcrumbsAreVisible(
    resourceName1,
    resourceName2,
    resourceName3,
  );

  await window.keyboard.press(`${modKey}+ArrowRight`);
  await pathBar.assert.breadcrumbsAreVisible(resourceName1);
  await pathBar.assert.breadcrumbsAreHidden(resourceName2, resourceName3);
});

test('shows only resources matching search', async ({
  resourcesTree,
  window,
  modKey,
}) => {
  await resourcesTree.assert.resourceIsVisible(resourceName1);
  await resourcesTree.assert.resourceIsVisible(resourceName4);

  await resourcesTree.searchField.fill(resourceName4);
  await resourcesTree.assert.resourceIsHidden(resourceName1);
  await resourcesTree.assert.resourceIsVisible(resourceName4);

  await resourcesTree.clearSearchButton.click();
  await resourcesTree.assert.resourceIsVisible(resourceName1);
  await resourcesTree.assert.resourceIsVisible(resourceName4);

  await resourcesTree.gotoRoot();
  await window.keyboard.press(`${modKey}+F`);
  await window.keyboard.type(resourceName4);
  await resourcesTree.assert.resourceIsHidden(resourceName1);
  await resourcesTree.assert.resourceIsVisible(resourceName4);
});
