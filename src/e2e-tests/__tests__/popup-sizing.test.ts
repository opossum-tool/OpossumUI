// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, stubOpenDialogSync, test } from '../utils';

const [compactId, compactAttribution] = faker.opossum.rawAttribution();
const attributions = Array.from({ length: 6 }, (_, index) =>
  faker.opossum.rawAttribution({ packageName: `attribution-${index}` }),
);
const compactResources = Array.from(
  { length: 5 },
  (_, index) => `file-${index}`,
);
const crowdedResources = Array.from(
  { length: 40 },
  (_, index) => `file-${index.toString().padStart(2, '0')}`,
);
const lastAttribution = attributions[attributions.length - 1][1];
const lastResource = crowdedResources[crowdedResources.length - 1];

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: {
        compact: Object.fromEntries(compactResources.map((name) => [name, 1])),
        crowded: Object.fromEntries(crowdedResources.map((name) => [name, 1])),
        readonly: 1,
      },
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: Object.fromEntries([
        [compactId, compactAttribution],
        ...attributions,
      ]),
      resourcesToAttributions: {
        ...Object.fromEntries(
          compactResources.map((name) => [`/compact/${name}`, [compactId]]),
        ),
        ...Object.fromEntries(
          crowdedResources.map((name) => [
            `/crowded/${name}`,
            attributions.map(([id]) => id),
          ]),
        ),
        '/readonly': attributions.map(([id]) => id),
      },
    }),
    readonlyRules: [{ path: '/readonly', readonly: true }],
  },
});

test('shows a short confirmation without unnecessary tree scrolling', async ({
  resourcesTree,
  attributionsPanel,
  attributionDetails,
  confirmDeletePopup,
}) => {
  await resourcesTree.goto('compact', compactResources[0]);
  await attributionsPanel.packageCard.click(compactAttribution);
  await attributionDetails.deleteButton.click();

  await confirmDeletePopup.assert.controlsAreInViewport();
  await confirmDeletePopup.assert.resourceIsInViewport(
    compactResources[compactResources.length - 1],
  );
  await confirmDeletePopup.assert.treeHasNoScrollbar();
  await confirmDeletePopup.assert.bodyHasNoScrollbar();
});

test('keeps a crowded confirmation usable in a small window', async ({
  window,
  resourcesTree,
  attributionsPanel,
  confirmDeletePopup,
}) => {
  await resourcesTree.goto('crowded', crowdedResources[0]);
  for (const [, attribution] of attributions) {
    await attributionsPanel.packageCard.checkbox(attribution).check();
  }
  await attributionsPanel.deleteButton.click();
  await window.setViewportSize({ width: 800, height: 600 });

  await confirmDeletePopup.assert.controlsAreInViewport();
  await confirmDeletePopup.assert.warningIsInViewport();
  await confirmDeletePopup.scrollToAttribution(lastAttribution);
  await confirmDeletePopup.scrollToResource(lastResource);
  await confirmDeletePopup.assert.controlsAreInViewport();
  await confirmDeletePopup.assert.bodyHasNoScrollbar();
});

test('keeps split controls visible while scrolling an expanded folder', async ({
  window,
  menuBar,
  splitDialog,
}) => {
  await menuBar.createSplit();
  await window.setViewportSize({ width: 800, height: 600 });
  await splitDialog.expandResource('/crowded');

  await splitDialog.assert.controlsAreInViewport();
  await splitDialog.scrollToResource(lastResource);
  await splitDialog.assert.controlsAreInViewport();
  await splitDialog.assert.bodyHasNoScrollbar();
});

test('scrolls a long merge file list while keeping the controls visible', async ({
  window,
  menuBar,
  mergeOpossumFilesDialog,
}) => {
  await window.setViewportSize({ width: 800, height: 650 });
  await menuBar.mergeSplitFilesIntoCurrentFile();
  await mergeOpossumFilesDialog.selectNewOutputFile();
  const filePaths = Array.from(
    { length: 60 },
    (_, index) =>
      `/partitions/partition-${index.toString().padStart(2, '0')}.opossum`,
  );
  await stubOpenDialogSync(window.app, filePaths);
  await mergeOpossumFilesDialog.inputFileSelection.click();

  await mergeOpossumFilesDialog.assert.controlsAreInViewport();
  await mergeOpossumFilesDialog.assert.bodyHasNoScrollbar();
  await mergeOpossumFilesDialog.scrollToInputFile(
    filePaths[filePaths.length - 1],
  );
  await mergeOpossumFilesDialog.assert.controlsAreInViewport();
  await mergeOpossumFilesDialog.assert.bodyHasNoScrollbar();
});
