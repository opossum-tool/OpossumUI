// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const attributionCount = 450;
const packageVersion = '1.0.0';
const resourceName = 'sort-root';

const attributionEntries = Array.from(
  { length: attributionCount },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `sort-${index.toString().padStart(3, '0')}`,
      packageVersion,
    }),
);
const firstAttribution = attributionEntries[0][1];
const lastAttribution = attributionEntries[attributionCount - 1][1];

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({ [resourceName]: 1 }),
      externalAttributions: {},
      resourcesToAttributions: faker.opossum.resourcesToAttributions({}),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: Object.fromEntries(attributionEntries),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: attributionEntries.map(
          ([attributionId]) => attributionId,
        ),
      }),
    }),
  },
});

test('resets the scroll position when the attribution list is re-sorted', async ({
  window,
  resourcesTree,
  attributionsPanel,
}) => {
  await window.setViewportSize({ width: 1920, height: 1080 });
  await resourcesTree.goto(resourceName);
  await attributionsPanel.packageCard.assert.isFirstVisible(firstAttribution);

  // Load every page of the default (alphabetical) result set.
  await attributionsPanel.scrollToBottomUntilVisible(lastAttribution);

  // Sorting away replaces the result set; the fresh order is not cached yet.
  await attributionsPanel.sortButton.click();
  await attributionsPanel.sortings.criticality.click();
  await attributionsPanel.closeFilterMenu();
  await attributionsPanel.assert.loadingIndicatorIsHidden();

  // Load every page of the criticality result set.
  await attributionsPanel.scrollToBottomUntilVisible(lastAttribution);

  // Sorting back hits the cached alphabetical result set: the list must not
  // keep the retained scroll offset of the previous result set.
  await attributionsPanel.sortButton.click();
  await attributionsPanel.sortings.name.click();
  await attributionsPanel.closeFilterMenu();
  await attributionsPanel.assert.loadingIndicatorIsHidden();
  await attributionsPanel.packageCard.assert.isFirstVisible(firstAttribution);
  await attributionsPanel.packageCard.assert.isInViewport(firstAttribution);
});
