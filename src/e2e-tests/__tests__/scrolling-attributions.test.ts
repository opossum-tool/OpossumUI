// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const attributionCount = 20;
const offscreenAttributionIndex = 15;
const resourceName = 'scroll-root';
const childResourceName = 'scroll-child';
const packageVersion = '1.0.0';

const manualAttributionEntries = Array.from(
  { length: attributionCount },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `manual-${index.toString().padStart(2, '0')}`,
      packageVersion,
    }),
);
const externalAttributionEntries = Array.from(
  { length: attributionCount },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `signal-${index.toString().padStart(2, '0')}`,
      packageVersion,
    }),
);

const manualAttributions = Object.fromEntries(manualAttributionEntries);
const externalAttributions = Object.fromEntries(externalAttributionEntries);
const firstManualAttribution = manualAttributionEntries[0][1];
const offscreenManualAttribution =
  manualAttributionEntries[offscreenAttributionIndex][1];
const firstExternalAttribution = externalAttributionEntries[0][1];
const offscreenExternalAttribution =
  externalAttributionEntries[offscreenAttributionIndex][1];

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: {
        [resourceName]: {
          [childResourceName]: 1,
        },
      },
      externalAttributions,
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName, childResourceName)]:
          externalAttributionEntries.map(([attributionId]) => attributionId),
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions,
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: manualAttributionEntries.map(
          ([attributionId]) => attributionId,
        ),
      }),
    }),
  },
});

test('keeps the first attribution clickable after scrolling', async ({
  window,
  resourcesTree,
  attributionsPanel,
  attributionDetails,
}) => {
  await window.setViewportSize({ width: 1920, height: 1080 });
  await resourcesTree.goto(resourceName);
  await attributionsPanel.packageCard.assert.isFirstVisible(
    firstManualAttribution,
  );

  await attributionsPanel.packageCard.assert.isVisible(
    offscreenManualAttribution,
  );
  await attributionsPanel.packageCard.click(offscreenManualAttribution);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    offscreenManualAttribution,
  );

  await attributionsPanel.scrollToTop();
  await attributionsPanel.packageCard.assert.isFirstVisible(
    firstManualAttribution,
  );
  await attributionsPanel.packageCard.click(firstManualAttribution);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    firstManualAttribution,
  );
});

test('keeps the first signal clickable after scrolling', async ({
  window,
  signalsPanel,
  attributionDetails,
}) => {
  await window.setViewportSize({ width: 1920, height: 1080 });
  await signalsPanel.assert.selectedTabIs('onChildren');
  await signalsPanel.packageCard.assert.isFirstVisible(
    firstExternalAttribution,
  );

  await signalsPanel.packageCard.assert.isVisible(offscreenExternalAttribution);
  await signalsPanel.packageCard.click(offscreenExternalAttribution);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    offscreenExternalAttribution,
  );

  await signalsPanel.scrollToTop();
  await signalsPanel.packageCard.assert.isFirstVisible(
    firstExternalAttribution,
  );
  await signalsPanel.packageCard.click(firstExternalAttribution);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    firstExternalAttribution,
  );
});
