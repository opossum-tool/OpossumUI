// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const SELECTED_LICENSE = 'MIT';
const [
  resourceWithExternalSelectedLicense,
  nestedResourceWithExternalSelectedLicense,
  leafResourceWithExternalSelectedLicense,
  resourceWithExternalDifferentLicense,
  nestedResourceWithExternalDifferentLicense,
  leafResourceWithExternalDifferentLicense,
  anotherResourceWithExternalDifferentLicense,
  resourceWithManualSelectedLicense,
] = faker.opossum.resourceNames({ count: 8 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  licenseName: SELECTED_LICENSE,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  licenseName: 'Apache-2.0',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  licenseName: 'BSD-3-Clause',
});
const [attributionId4, packageInfo4] = faker.opossum.rawAttribution({
  licenseName: SELECTED_LICENSE,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceWithExternalSelectedLicense]: {
          [nestedResourceWithExternalSelectedLicense]: {
            [leafResourceWithExternalSelectedLicense]: 1,
          },
        },
        [resourceWithExternalDifferentLicense]: {
          [nestedResourceWithExternalDifferentLicense]: {
            [leafResourceWithExternalDifferentLicense]: 1,
          },
        },
        [anotherResourceWithExternalDifferentLicense]: 1,
        [resourceWithManualSelectedLicense]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(
          resourceWithExternalSelectedLicense,
          nestedResourceWithExternalSelectedLicense,
          leafResourceWithExternalSelectedLicense,
        )]: [attributionId1],
        [faker.opossum.filePath(
          resourceWithExternalDifferentLicense,
          nestedResourceWithExternalDifferentLicense,
          leafResourceWithExternalDifferentLicense,
        )]: [attributionId2],
        [faker.opossum.filePath(anotherResourceWithExternalDifferentLicense)]: [
          attributionId3,
        ],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId4]: packageInfo4,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceWithManualSelectedLicense)]: [
          attributionId4,
        ],
      }),
    }),
  },
});

test('shows expected resources as user browses through resources', async ({
  resourcesTree,
}) => {
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalDifferentLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    anotherResourceWithExternalDifferentLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    resourceWithManualSelectedLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    nestedResourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    leafResourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    nestedResourceWithExternalDifferentLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    leafResourceWithExternalDifferentLicense,
  );

  await resourcesTree.goto(resourceWithExternalDifferentLicense);
  await resourcesTree.assert.resourceIsVisible(
    nestedResourceWithExternalDifferentLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    leafResourceWithExternalDifferentLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    nestedResourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    leafResourceWithExternalSelectedLicense,
  );
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

test('shows expected breadcrumbs as user navigates through browser history', async ({
  modKey,
  resourcesTree,
  pathBar,
  window,
}) => {
  await resourcesTree.gotoRoot();
  await pathBar.assert.goBackButtonIsDisabled();
  await pathBar.assert.goForwardButtonIsDisabled();

  await resourcesTree.goto(
    resourceWithExternalSelectedLicense,
    nestedResourceWithExternalSelectedLicense,
    leafResourceWithExternalSelectedLicense,
  );
  await pathBar.assert.goBackButtonIsEnabled();
  await pathBar.assert.goForwardButtonIsDisabled();
  await pathBar.assert.breadcrumbsAreVisible(
    resourceWithExternalSelectedLicense,
    nestedResourceWithExternalSelectedLicense,
    leafResourceWithExternalSelectedLicense,
  );

  await pathBar.goBackButton.click();
  await pathBar.assert.goForwardButtonIsEnabled();
  await pathBar.assert.breadcrumbsAreVisible(
    resourceWithExternalSelectedLicense,
    nestedResourceWithExternalSelectedLicense,
  );
  await pathBar.assert.breadcrumbsAreHidden(
    leafResourceWithExternalSelectedLicense,
  );

  await pathBar.goForwardButton.click();
  await pathBar.assert.breadcrumbsAreVisible(
    resourceWithExternalSelectedLicense,
    nestedResourceWithExternalSelectedLicense,
    leafResourceWithExternalSelectedLicense,
  );

  await pathBar.clickOnBreadcrumb(resourceWithExternalSelectedLicense);
  await pathBar.assert.breadcrumbsAreVisible(
    resourceWithExternalSelectedLicense,
  );
  await pathBar.assert.breadcrumbsAreHidden(
    nestedResourceWithExternalSelectedLicense,
    leafResourceWithExternalSelectedLicense,
  );

  await window.keyboard.press(`${modKey}+ArrowLeft`);
  await pathBar.assert.breadcrumbsAreVisible(
    resourceWithExternalSelectedLicense,
    nestedResourceWithExternalSelectedLicense,
    leafResourceWithExternalSelectedLicense,
  );

  await window.keyboard.press(`${modKey}+ArrowRight`);
  await pathBar.assert.breadcrumbsAreVisible(
    resourceWithExternalSelectedLicense,
  );
  await pathBar.assert.breadcrumbsAreHidden(
    nestedResourceWithExternalSelectedLicense,
    leafResourceWithExternalSelectedLicense,
  );
});

test('shows only resources matching search', async ({
  resourcesTree,
  window,
  modKey,
}) => {
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalDifferentLicense,
  );

  await resourcesTree.searchField.fill(resourceWithExternalDifferentLicense);
  await resourcesTree.assert.resourceIsHidden(
    resourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalDifferentLicense,
  );

  await resourcesTree.clearSearchButton.click();
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalDifferentLicense,
  );

  await resourcesTree.gotoRoot();
  await window.keyboard.press(`${modKey}+F`);
  await window.keyboard.type(resourceWithExternalDifferentLicense);
  await resourcesTree.assert.resourceIsHidden(
    resourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalDifferentLicense,
  );
});

test('shows only resources matching selected external attribution license', async ({
  resourcesTree,
}) => {
  await resourcesTree.gotoRoot();
  await resourcesTree.filterButton.click();
  await resourcesTree.selectLicenseName(SELECTED_LICENSE);
  await resourcesTree.closeMenu();
  await resourcesTree.closeMenu();

  await resourcesTree.assert.resourceIsVisible(
    resourceWithExternalSelectedLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    resourceWithManualSelectedLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    resourceWithExternalDifferentLicense,
  );
  await resourcesTree.assert.resourceIsHidden(
    anotherResourceWithExternalDifferentLicense,
  );
});
