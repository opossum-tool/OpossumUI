// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const manualAttributionCount = 20;
const signalAttributionCount = 440;
const signalGroupBoundary = 220;
const offscreenAttributionIndex = 5;
const resourceName = 'scroll-root';
const childResourceName = 'scroll-child';
const emptyResourceName = 'scroll-empty-root';
const emptyChildResourceName = 'scroll-empty-child';
const packageVersion = '1.0.0';
const signalSource = { name: 'ScanCode', documentConfidence: 0 };
const secondarySignalSource = {
  name: 'known-source',
  documentConfidence: 0,
};

const manualAttributionEntries = Array.from(
  { length: manualAttributionCount },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `manual-${index.toString().padStart(2, '0')}`,
      packageVersion,
    }),
);
const childManualAttributionEntries = Array.from({ length: 40 }, (_, index) =>
  faker.opossum.rawAttribution({
    packageName: `child-manual-${index.toString().padStart(2, '0')}`,
    packageVersion,
  }),
);
const externalAttributionEntries = Array.from(
  { length: signalAttributionCount },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `signal-${index.toString().padStart(2, '0')}`,
      packageVersion,
      source:
        index < signalGroupBoundary ? signalSource : secondarySignalSource,
    }),
);

const manualAttributions = Object.fromEntries([
  ...manualAttributionEntries,
  ...childManualAttributionEntries,
]);
const externalAttributions = Object.fromEntries(externalAttributionEntries);
const firstManualAttribution = manualAttributionEntries[0][1];
const offscreenManualAttribution =
  manualAttributionEntries[offscreenAttributionIndex][1];
const firstExternalAttribution =
  externalAttributionEntries[signalGroupBoundary][1];
const firstExternalAttributionInSecondGroup = externalAttributionEntries[0][1];
const lastChildAttributionEntry =
  childManualAttributionEntries[childManualAttributionEntries.length - 1];
const reportChildAttribution = lastChildAttributionEntry[1];
const reportChildAttributionId = lastChildAttributionEntry[0];
const firstChildAttribution = childManualAttributionEntries[0][1];

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: {
        [resourceName]: {
          [childResourceName]: 1,
        },
        [emptyResourceName]: {
          [emptyChildResourceName]: 1,
        },
      },
      externalAttributions,
      externalAttributionSources: {
        configured: { name: signalSource.name, priority: 2 },
        [secondarySignalSource.name]: {
          name: 'Known',
          priority: 1,
        },
      },
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName, childResourceName)]:
          externalAttributionEntries.map(([attributionId]) => attributionId),
        [faker.opossum.filePath(emptyResourceName, emptyChildResourceName)]:
          externalAttributionEntries.map(([attributionId]) => attributionId),
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions,
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: manualAttributionEntries.map(
          ([attributionId]) => attributionId,
        ),
        [faker.opossum.filePath(resourceName, childResourceName)]:
          childManualAttributionEntries.map(([attributionId]) => attributionId),
        [faker.opossum.filePath(emptyResourceName, emptyChildResourceName)]:
          childManualAttributionEntries.map(([attributionId]) => attributionId),
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

  await signalsPanel.jumpToNextGroup('Known');
  await signalsPanel.packageCard.assert.isVisible(
    firstExternalAttributionInSecondGroup,
  );
  await signalsPanel.packageCard.click(firstExternalAttributionInSecondGroup);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    firstExternalAttributionInSecondGroup,
  );

  await signalsPanel.jumpToPreviousGroup('ScanCode');
  await signalsPanel.packageCard.assert.isFirstVisible(
    firstExternalAttribution,
  );
  await signalsPanel.packageCard.assert.isInViewport(firstExternalAttribution);
  await signalsPanel.packageCard.click(firstExternalAttribution);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    firstExternalAttribution,
  );
});

test('scrolls a selected attribution into view after report navigation', async ({
  window,
  resourcesTree,
  attributionsPanel,
  attributionDetails,
  reportView,
  topBar,
}) => {
  await window.setViewportSize({ width: 1920, height: 1080 });
  await resourcesTree.goto(emptyResourceName);
  await attributionsPanel.assert.selectedTabIs('onChildren');
  await attributionsPanel.packageCard.assert.isVisible(firstChildAttribution);
  await attributionsPanel.packageCard.assert.isNotInViewport(
    reportChildAttribution,
  );
  await attributionsPanel.scrollToBottom();
  await attributionsPanel.assert.loadingIndicatorIsHidden();
  await attributionsPanel.packageCard.assert.isInViewport(
    reportChildAttribution,
  );
  await attributionsPanel.packageCard.click(reportChildAttribution);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    reportChildAttribution,
  );

  await attributionsPanel.scrollToTop();
  await attributionsPanel.packageCard.assert.isFirstVisible(
    firstChildAttribution,
  );
  await attributionsPanel.packageCard.assert.isNotInViewport(
    reportChildAttribution,
  );

  await topBar.gotoReportView();
  await reportView.openAttributionInAuditView(reportChildAttributionId);

  await topBar.assert.auditViewIsActive();
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    reportChildAttribution,
  );
  await attributionsPanel.packageCard.assert.isInViewport(
    reportChildAttribution,
  );
});
