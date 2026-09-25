// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ATTRIBUTION_PAGE_SIZE } from '../../Frontend/util/attribution-page-query';
import { faker, test } from '../utils';

const packageVersion = '1.0.0';
const manualAttributionCount = ATTRIBUTION_PAGE_SIZE + 20;
const resourceNames = {
  origin: 'origin',
  destination: 'destination',
  other: 'other',
  target: 'target',
  child: 'child',
  leaf: 'leaf',
};
const [targetId, target] = faker.opossum.rawAttribution({
  packageName: 'shared-target',
  packageVersion,
  licenseName: 'Target-License',
});
const [competingId, competing] = faker.opossum.rawAttribution({
  packageName: 'origin-competing',
  packageVersion,
  licenseName: 'Competing-License',
});
const [destinationManualId, destinationManual] = faker.opossum.rawAttribution({
  packageName: 'destination-manual',
  packageVersion,
  licenseName: 'Destination-License',
});
const manualPrecedingAttributions = Array.from(
  { length: manualAttributionCount },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `manual-${index.toString().padStart(3, '0')}`,
      packageVersion,
    }),
);
const [manualGroupSignalId, manualGroupSignal] = faker.opossum.rawAttribution({
  packageName: 'origin-signal-for-navigation',
  packageVersion,
  source: { name: 'Manual-group scan', documentConfidence: 0 },
});
const source = { name: 'ScanCode', documentConfidence: 0 };
const [signalId, signal] = faker.opossum.rawAttribution({
  packageName: 'zzzz-target',
  packageVersion,
  licenseName: 'Signal-License',
  source,
});
const [otherSignalId, otherSignal] = faker.opossum.rawAttribution({
  packageName: 'origin-signal',
  packageVersion,
  licenseName: 'Other-Signal-License',
  source,
});
const precedingSignals = Array.from(
  { length: ATTRIBUTION_PAGE_SIZE + 20 },
  (_, index) =>
    faker.opossum.rawAttribution({
      packageName: `destination-${index.toString().padStart(3, '0')}`,
      packageVersion,
      source,
    }),
);

const resources = faker.opossum.resources({
  [resourceNames.origin]: {
    [resourceNames.target]: 1,
    [resourceNames.child]: 1,
  },
  [resourceNames.destination]: { [resourceNames.leaf]: 1 },
  [resourceNames.other]: { [resourceNames.leaf]: 1 },
});

const directPaths = {
  origin: faker.opossum.folderPath(resourceNames.origin),
  child: faker.opossum.filePath(resourceNames.origin, resourceNames.child),
  destination: faker.opossum.filePath(
    resourceNames.destination,
    resourceNames.leaf,
  ),
  other: faker.opossum.filePath(resourceNames.other, resourceNames.leaf),
};

test.describe('selected manual attribution', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        resources,
        externalAttributions: faker.opossum.rawAttributions({
          [manualGroupSignalId]: manualGroupSignal,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [directPaths.origin]: [manualGroupSignalId],
        }),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: faker.opossum.rawAttributions({
          [targetId]: target,
          [competingId]: competing,
          [destinationManualId]: destinationManual,
          ...Object.fromEntries(manualPrecedingAttributions),
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [directPaths.origin]: [
            targetId,
            competingId,
            ...manualPrecedingAttributions.map(([id]) => id),
          ],
          [faker.opossum.folderPath(resourceNames.destination)]: [competingId],
          [directPaths.destination]: [
            destinationManualId,
            targetId,
            ...manualPrecedingAttributions.map(([id]) => id),
          ],
          [faker.opossum.folderPath(resourceNames.other)]: [competingId],
          [directPaths.other]: [targetId],
        }),
      }),
    },
  });

  test('preserves a manual attribution across linked destinations', async ({
    window,
    resourcesTree,
    linkedResourcesTree,
    attributionsPanel,
    attributionDetails,
  }) => {
    await window.setViewportSize({ width: 1920, height: 1080 });
    await resourcesTree.goto(resourceNames.origin);
    await attributionsPanel.sortButton.click();
    await attributionsPanel.sortings.name.click();
    await attributionsPanel.assert.selectedTabIs('onResource');
    await attributionsPanel.packageCard.assert.isFirstVisible(
      manualPrecedingAttributions[0][1],
    );
    await attributionsPanel.scrollToBottom();
    await attributionsPanel.assert.loadingIndicatorIsHidden();
    await attributionsPanel.packageCard.assert.isInViewport(target);
    await attributionsPanel.packageCard.click(target);
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(target);
    await linkedResourcesTree.assert.resourceAtPathIsVisible(
      faker.opossum.folderPath(resourceNames.destination),
    );
    await linkedResourcesTree.assert.resourceAtPathIsVisible(
      faker.opossum.folderPath(resourceNames.other),
    );
    await linkedResourcesTree.assert.totalCountIs(3);
    await linkedResourcesTree.ensureResourceExpanded(
      faker.opossum.folderPath(resourceNames.destination),
    );
    await linkedResourcesTree.assert.resourceAtPathIsVisible(
      directPaths.destination,
    );
    await linkedResourcesTree.ensureResourceExpanded(
      faker.opossum.folderPath(resourceNames.other),
    );
    await linkedResourcesTree.assert.resourceAtPathIsVisible(directPaths.other);

    await linkedResourcesTree.clickResource(resourceNames.destination);
    await linkedResourcesTree.assert.resourceAtPathIsSelected(
      faker.opossum.folderPath(resourceNames.destination),
    );
    await attributionsPanel.assert.selectedTabIs('onChildren');
    await attributionsPanel.packageCard.assert.isInViewport(target);
    await attributionsPanel.packageCard.assert.isNotInViewport(
      manualPrecedingAttributions[0][1],
    );
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(target);

    await linkedResourcesTree.clickResource(resourceNames.other);
    await attributionsPanel.assert.selectedTabIs('onChildren');
    await attributionsPanel.packageCard.assert.isInViewport(target);
    await attributionsPanel.assert.loadingIndicatorIsHidden();
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(target);
    await linkedResourcesTree.clickResource(resourceNames.destination);
    await linkedResourcesTree.assert.resourceAtPathIsSelected(
      faker.opossum.folderPath(resourceNames.destination),
    );
    await attributionsPanel.assert.selectedTabIs('onChildren');
    await attributionsPanel.packageCard.assert.isInViewport(target);
    await attributionsPanel.assert.loadingIndicatorIsHidden();
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(target);

    await attributionsPanel.scrollToTop();
    await attributionsPanel.packageCard.assert.isInViewport(
      manualPrecedingAttributions[0][1],
    );
    await attributionsPanel.packageCard.assert.isNotInViewport(target);

    await linkedResourcesTree.clickResourceAtPath(directPaths.destination);
    await linkedResourcesTree.assert.resourceAtPathIsSelected(
      directPaths.destination,
    );
    await attributionsPanel.assert.selectedTabIs('onResource');
    await attributionsPanel.scrollToBottom();
    await attributionsPanel.assert.loadingIndicatorIsHidden();
    await attributionsPanel.packageCard.assert.isInViewport(target);
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(target);
  });

  test('selects direct manual attribution on ordinary resource navigation', async ({
    resourcesTree,
    signalsPanel,
    attributionsPanel,
    attributionDetails,
  }) => {
    await resourcesTree.goto(resourceNames.origin);
    await signalsPanel.tabs.onResource.click();
    await signalsPanel.packageCard.click(manualGroupSignal);
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(
      manualGroupSignal,
    );
    await resourcesTree.ensureResourceExpanded(
      faker.opossum.folderPath(resourceNames.destination),
    );
    await resourcesTree.clickResourceAtPath(directPaths.destination);
    await attributionsPanel.assert.selectedTabIs('onResource');
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(
      destinationManual,
    );
  });
});

test.describe('selected signal', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        resources,
        externalAttributions: faker.opossum.rawAttributions({
          [signalId]: signal,
          [otherSignalId]: otherSignal,
          ...Object.fromEntries(precedingSignals),
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [directPaths.origin]: [signalId, otherSignalId],
          [directPaths.child]: [signalId],
          [faker.opossum.folderPath(resourceNames.destination)]: [
            otherSignalId,
          ],
          [directPaths.destination]: [
            signalId,
            ...precedingSignals.map(([id]) => id),
          ],
          [directPaths.other]: [
            signalId,
            ...precedingSignals.map(([id]) => id),
          ],
        }),
      }),
    },
  });

  test('changes relation and loads an offscreen signal from a linked destination', async ({
    window,
    resourcesTree,
    linkedResourcesTree,
    signalsPanel,
    attributionDetails,
  }) => {
    await window.setViewportSize({ width: 1920, height: 1080 });
    await resourcesTree.goto(resourceNames.origin);
    await signalsPanel.sortButton.click();
    await signalsPanel.sortings.name.click();
    await signalsPanel.tabs.onResource.click();
    await signalsPanel.packageCard.click(signal);
    await linkedResourcesTree.assert.resourceAtPathIsVisible(
      directPaths.destination,
    );
    await linkedResourcesTree.assert.resourceAtPathIsVisible(directPaths.other);
    await linkedResourcesTree.assert.totalCountIs(4);

    await linkedResourcesTree.clickResource(resourceNames.destination);
    await linkedResourcesTree.assert.resourceAtPathIsSelected(
      faker.opossum.folderPath(resourceNames.destination),
    );
    await signalsPanel.assert.selectedTabIs('onChildren');
    await signalsPanel.packageCard.assert.isInViewport(signal);
    await signalsPanel.packageCard.assert.isNotInViewport(
      precedingSignals[0][1],
    );
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(signal);
    await attributionDetails.assert.linkButtonIsVisible();
    await attributionDetails.assert.linkButtonIsEnabled();
  });

  test('keeps a filtered selected signal linkable after linked navigation', async ({
    resourcesTree,
    linkedResourcesTree,
    signalsPanel,
    attributionDetails,
  }) => {
    await resourcesTree.goto(resourceNames.origin);
    await signalsPanel.tabs.onResource.click();
    await signalsPanel.packageCard.click(signal);
    await signalsPanel.searchField.fill('no matching signal');
    await signalsPanel.packageCard.assert.isHidden(signal);
    await signalsPanel.assert.loadingIndicatorIsHidden();
    await linkedResourcesTree.clickResource(resourceNames.destination);
    await attributionDetails.attributionForm.assert.matchesPackageInfo(signal);
    await attributionDetails.assert.linkButtonIsVisible();
    await attributionDetails.assert.linkButtonIsEnabled();
    await signalsPanel.searchField.clear();
    await signalsPanel.packageCard.assert.isVisible(signal);
    await signalsPanel.assert.selectedTabIs('onChildren');
    await attributionDetails.assert.linkButtonIsEnabled();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(signal);

    await signalsPanel.filterButton.click();
    await signalsPanel.filters.firstParty.click();
    await signalsPanel.closeFilterMenu();
    await signalsPanel.packageCard.assert.isHidden(signal);
    await attributionDetails.assert.linkButtonIsEnabled();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(signal);
    await signalsPanel.filterButton.click();
    await signalsPanel.filters.firstParty.click();
    await signalsPanel.closeFilterMenu();
    await signalsPanel.packageCard.assert.isVisible(signal);
  });

  test('reveals again on same-relation navigation and cached revisits', async ({
    window,
    resourcesTree,
    linkedResourcesTree,
    signalsPanel,
    attributionDetails,
  }) => {
    await window.setViewportSize({ width: 1920, height: 1080 });
    await resourcesTree.goto(resourceNames.origin);
    await signalsPanel.sortButton.click();
    await signalsPanel.sortings.name.click();
    await signalsPanel.tabs.onResource.click();
    await signalsPanel.packageCard.click(signal);

    for (const destination of [
      resourceNames.destination,
      resourceNames.other,
    ]) {
      await linkedResourcesTree.clickResource(destination);
      await linkedResourcesTree.assert.resourceAtPathIsSelected(
        destination === resourceNames.destination
          ? faker.opossum.folderPath(resourceNames.destination)
          : faker.opossum.folderPath(resourceNames.other),
      );
      await signalsPanel.assert.selectedTabIs('onChildren');
      await signalsPanel.packageCard.assert.isInViewport(signal);
      await attributionDetails.assert.loadingIndicatorIsHidden();
      await attributionDetails.attributionForm.assert.matchesPackageInfo(
        signal,
      );
      await signalsPanel.scrollToTop();
      await signalsPanel.packageCard.assert.isNotInViewport(signal);
    }

    for (const destination of [
      resourceNames.destination,
      resourceNames.other,
    ]) {
      await linkedResourcesTree.clickResource(destination);
      await signalsPanel.assert.selectedTabIs('onChildren');
      await signalsPanel.packageCard.assert.isInViewport(signal);
      await attributionDetails.assert.loadingIndicatorIsHidden();
      await attributionDetails.attributionForm.assert.matchesPackageInfo(
        signal,
      );
      await signalsPanel.scrollToTop();
      await signalsPanel.packageCard.assert.isNotInViewport(signal);
    }
  });

  test('preserves deliberate tab changes and resumes selected signal reveal on navigation', async ({
    window,
    resourcesTree,
    linkedResourcesTree,
    signalsPanel,
    attributionDetails,
  }) => {
    await window.setViewportSize({ width: 1920, height: 1080 });
    await resourcesTree.goto(resourceNames.origin);
    await signalsPanel.sortButton.click();
    await signalsPanel.sortings.name.click();
    await signalsPanel.tabs.onResource.click();
    await signalsPanel.packageCard.click(signal);
    await linkedResourcesTree.clickResource(resourceNames.destination);
    await signalsPanel.assert.selectedTabIs('onChildren');
    await signalsPanel.packageCard.assert.isInViewport(signal);

    await signalsPanel.tabs.onResource.click();
    await signalsPanel.assert.selectedTabIs('onResource');
    await signalsPanel.packageCard.assert.isVisible(otherSignal);
    await signalsPanel.assert.loadingIndicatorIsHidden();
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(signal);
    await linkedResourcesTree.clickResource(resourceNames.other);
    await signalsPanel.assert.selectedTabIs('onChildren');
    await signalsPanel.packageCard.assert.isInViewport(signal);
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(signal);
  });

  test('recovers a parent-only signal after returning through the linked tree', async ({
    window,
    resourcesTree,
    linkedResourcesTree,
    signalsPanel,
    attributionDetails,
  }) => {
    await window.setViewportSize({ width: 1920, height: 1080 });
    await resourcesTree.goto(resourceNames.origin);
    await signalsPanel.sortButton.click();
    await signalsPanel.sortings.name.click();
    await signalsPanel.tabs.onResource.click();
    await signalsPanel.packageCard.click(otherSignal);
    await linkedResourcesTree.clickResource(resourceNames.child);

    await linkedResourcesTree.assert.resourceAtPathIsSelected(
      directPaths.child,
    );
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(
      otherSignal,
    );
    await signalsPanel.packageCard.assert.isHidden(otherSignal);
    await attributionDetails.assert.linkButtonIsHidden();

    await linkedResourcesTree.clickResource(resourceNames.origin);
    await linkedResourcesTree.assert.resourceAtPathIsSelected(
      faker.opossum.folderPath(resourceNames.origin),
    );
    await signalsPanel.assert.selectedTabIs('onResource');
    await signalsPanel.packageCard.assert.isInViewport(otherSignal);
    await attributionDetails.assert.loadingIndicatorIsHidden();
    await attributionDetails.attributionForm.assert.matchesPackageInfo(
      otherSignal,
    );
    await attributionDetails.assert.linkButtonIsVisible();
    await attributionDetails.assert.linkButtonIsEnabled();
  });
});
