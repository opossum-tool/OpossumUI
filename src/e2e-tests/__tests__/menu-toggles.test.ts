// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { menuItemIds } from '../../ElectronBackend/main/menu/menuItemIds';
import { faker, test } from '../utils';

const metadata = faker.opossum.metadata();
const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
  classification: 0,
  criticality: 'medium',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
  classification: 1,
  criticality: 'high',
});
const source = faker.opossum.source();
const [manualAttributionId, manualPackageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      metadata,
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: {
            [resourceName3]: 1,
          },
        },
        [resourceName4]: 1,
        [resourceName5]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
      }),
      externalAttributionSources: faker.opossum.externalAttributionSources({
        [source.name]: faker.opossum.externalAttributionSource({
          isRelevantForPreferred: true,
        }),
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [manualAttributionId]: manualPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName5)]: [manualAttributionId],
      }),
    }),
  },
});

test('toggles QA mode, classification, and criticality, and opens project metadata via native menus', async ({
  attributionDetails,
  menuBar,
  projectMetadataPopup,
  projectStatisticsPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName5);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo,
  );
  await attributionDetails.assert.saveButtonIsDisabled();

  const qaModeIconUnchecked = await menuBar.getMenuItemIconReference(
    menuItemIds.qaMode,
  );
  const classificationIconChecked = await menuBar.getMenuItemIconReference(
    menuItemIds.showClassifications,
  );

  await attributionDetails.attributionForm.openAuditingOptionsMenu();
  await attributionDetails.attributionForm.assert.auditingMenuOptionIsHidden(
    'currentlyPreferredOption',
  );

  await menuBar.toggleQaMode();
  await attributionDetails.attributionForm.assert.auditingMenuOptionIsVisible(
    'currentlyPreferredOption',
  );
  await attributionDetails.attributionForm.closeAuditingOptionsMenu();

  await expect
    .poll(() => menuBar.getMenuItemIconReference(menuItemIds.qaMode))
    .not.toBe(qaModeIconUnchecked);

  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.assert.titleIsVisible();
  // hover on title to avoid getting tooltips that mess up locators
  await projectStatisticsPopup.title.hover();

  await projectStatisticsPopup.assert.signalsByCriticalityIsVisible();
  await projectStatisticsPopup.assert.signalsByClassificationIsShown();

  await menuBar.toggleShowClassification();
  await projectStatisticsPopup.assert.signalsByClassificationIsNotShown();

  await expect
    .poll(() =>
      menuBar.getMenuItemIconReference(menuItemIds.showClassifications),
    )
    .not.toBe(classificationIconChecked);

  await menuBar.toggleShowCriticality();
  await projectStatisticsPopup.assert.signalsByCriticalityIsNotVisible();

  await projectStatisticsPopup.closeButton.click();
  await projectStatisticsPopup.assert.titleIsHidden();

  await menuBar.openProjectMetadata();
  await projectMetadataPopup.assert.titleIsVisible();
  await projectMetadataPopup.assert.attributeIsVisible(metadata.projectId);

  await projectMetadataPopup.closeButton.click();
  await projectMetadataPopup.assert.titleIsHidden();

  // Toggle the settings back to also exercise the reverse direction of the
  // switchable menu items.
  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.assert.titleIsVisible();
  // hover on title to avoid getting tooltips that mess up locators
  await projectStatisticsPopup.title.hover();

  await menuBar.toggleShowClassification();
  await projectStatisticsPopup.assert.signalsByClassificationIsShown();

  await menuBar.toggleShowCriticality();
  await projectStatisticsPopup.assert.signalsByCriticalityIsVisible();

  await projectStatisticsPopup.closeButton.click();
  await projectStatisticsPopup.assert.titleIsHidden();

  await expect
    .poll(() =>
      menuBar.getMenuItemIconReference(menuItemIds.showClassifications),
    )
    .toBe(classificationIconChecked);

  await attributionDetails.attributionForm.openAuditingOptionsMenu();
  await menuBar.toggleQaMode();
  await attributionDetails.attributionForm.assert.auditingMenuOptionIsHidden(
    'currentlyPreferredOption',
  );
  await attributionDetails.attributionForm.closeAuditingOptionsMenu();

  await expect
    .poll(() => menuBar.getMenuItemIconReference(menuItemIds.qaMode))
    .toBe(qaModeIconUnchecked);
});
