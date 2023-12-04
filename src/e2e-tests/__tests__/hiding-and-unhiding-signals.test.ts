// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.externalAttribution();
const [attributionId2, packageInfo2] = faker.opossum.externalAttribution();
const [attributionId3, packageInfo3] = faker.opossum.externalAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: 1 },
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2)]: [
          attributionId1,
          attributionId3,
        ],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [
          attributionId1,
          attributionId2,
        ],
      }),
    }),
    outputData: faker.opossum.outputData({
      resolvedExternalAttributions: new Set([attributionId1]),
    }),
  },
});

test('hides and unhides signals via attribution details', async ({
  resourceBrowser,
  resourceDetails,
  attributionDetails,
}) => {
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.signalCard.assert.isHidden(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo3, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceDetails.signalCard.click(packageInfo3);
  await attributionDetails.showHideSignalButton.click();
  await resourceDetails.signalCard.assert.isHidden(packageInfo3, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName4);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);

  await resourceDetails.signalCard.click(packageInfo2);
  await attributionDetails.showHideSignalButton.click();
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceBrowser.goto(resourceName3);
  await resourceDetails.signalCard.click(packageInfo2);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);
  await attributionDetails.showHideSignalButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);
});

test('hides and unhides signals via context menu', async ({
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.signalCard.assert.isHidden(packageInfo1, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo3, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceDetails.signalCard.openContextMenu(packageInfo3);
  await resourceDetails.signalCard.assert.contextMenu.buttonsAreVisible(
    'hideButton',
  );
  await resourceDetails.signalCard.assert.contextMenu.buttonsAreHidden(
    'unhideButton',
  );

  await resourceDetails.signalCard.contextMenu.hideButton.click();
  await resourceDetails.signalCard.assert.isHidden(packageInfo3, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName4);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.hideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceBrowser.goto(resourceName3);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);

  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.unhideButton.click();
  await resourceDetails.signalCard.assert.addButtonIsVisible(packageInfo2);
});
