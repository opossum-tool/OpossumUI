// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import {
  applyUnreviewedResourceFilter,
  clearUnreviewedResourceFilter,
  navigateToResource,
  prepareResourceSelection,
  prepareResourceTreeFilter,
  selectResourceAndWaitForAudit,
  waitForAuditReady,
} from './performance-test-helpers';
import type { PerformanceWorkflowContext } from './performance-workflow-context';

export async function runResourceWorkflows({
  model,
  runFilePath,
  appLoadTimeout,
  attributionDetails,
  attributionsPanel,
  menuBar,
  pathBar,
  projectStatisticsPopup,
  reportView,
  resourcesTree,
  runScenario,
  signalsPanel,
  topBar,
}: PerformanceWorkflowContext): Promise<void> {
  const expandAndSelectScenario = model.scenarios.expandAndSelect;
  const expandAndSelectAnchors = expandAndSelectScenario.anchors;
  const expectedContent = expandAndSelectScenario.expected;
  const searchAnchors = model.scenarios.resourceSearch.anchors;
  const resourceFilter = model.scenarios.resourceFilter;
  const attributionFilter = model.scenarios.attributionFilter;
  const signalSearch = model.scenarios.signalSearch;
  const signalSort = model.scenarios.signalSort;
  await runScenario({
    id: 'load-file',
    title: 'open the performance file',
    execute: async () => {
      await menuBar.openFileAndWaitForLoad(runFilePath, appLoadTimeout);
      await waitForAuditReady({
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
        topBar,
      });
    },
  });

  await runScenario({
    id: 'expand-and-select-resource',
    title: 'expand and select a resource directory',
    setup: async () => {
      await resourcesTree.gotoRoot();
      await resourcesTree.assert.resourceIsVisible(
        expandAndSelectAnchors.targetResourceName,
      );
      await resourcesTree.assert.resourceIsHidden(
        expandAndSelectAnchors.childResourceName,
      );
      await Promise.all([
        attributionsPanel.assert.loadingIndicatorIsHidden(),
        signalsPanel.assert.loadingIndicatorIsHidden(),
        attributionDetails.assert.loadingIndicatorIsHidden(),
      ]);
    },
    execute: async () => {
      await resourcesTree.goto(expandAndSelectAnchors.targetResourceName);
      await Promise.all([
        pathBar.assert.breadcrumbsAreVisible(
          expandAndSelectAnchors.targetResourceName,
        ),
        resourcesTree.assert.resourceIsVisible(
          expandAndSelectAnchors.childResourceName,
        ),
        attributionsPanel.packageCard.assert.isVisible(
          expectedContent.attribution.packageInfo,
        ),
        signalsPanel.packageCard.assert.isVisible(
          expectedContent.signal.packageInfo,
        ),
        attributionDetails.attributionForm.assert.matchesPackageInfo(
          expectedContent.attribution.packageInfo,
        ),
        attributionsPanel.assert.selectedTabIs('onResource'),
        signalsPanel.assert.selectedTabIs('onResource'),
        attributionsPanel.assert.loadingIndicatorIsHidden(),
        signalsPanel.assert.loadingIndicatorIsHidden(),
        attributionDetails.assert.loadingIndicatorIsHidden(),
        attributionDetails.assert.isVisible(),
      ]);
    },
  });

  await runScenario({
    id: 'search-resource-tree',
    title: 'search the resource tree',
    execute: async () => {
      await resourcesTree.searchField.fill(searchAnchors.targetResourceName);
      await Promise.all([
        resourcesTree.assert.resourceIsVisible(
          searchAnchors.targetResourceName,
        ),
        resourcesTree.assert.resourceIsHidden(
          expandAndSelectAnchors.targetResourceName,
        ),
      ]);
    },
    teardown: async () => {
      await resourcesTree.clearSearchButton.click();
      await resourcesTree.assert.resourceIsVisible(
        expandAndSelectAnchors.targetResourceName,
      );
    },
  });

  await runScenario({
    id: 'filter-resource-tree',
    title: 'filter the resource tree',
    setup: async () => {
      await prepareResourceTreeFilter({
        reviewedResource: resourceFilter.reviewedResource,
        unreviewedResource: resourceFilter.unreviewedResource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
    },
    execute: async () => {
      await applyUnreviewedResourceFilter({
        reviewedResource: resourceFilter.reviewedResource,
        unreviewedResource: resourceFilter.unreviewedResource,
        resourcesTree,
      });
    },
    teardown: async () => {
      await clearUnreviewedResourceFilter({
        reviewedResource: resourceFilter.reviewedResource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await Promise.all([
        attributionsPanel.assert.loadingIndicatorIsHidden(),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
  });

  await runScenario({
    id: 'search-signals',
    title: 'search signals',
    setup: async () => {
      await navigateToResource({
        anchor: signalSearch.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await Promise.all([
        signalsPanel.packageCard.assert.isVisible(
          signalSearch.matchingSignal.packageInfo,
        ),
        signalsPanel.packageCard.assert.isVisible(
          signalSearch.nonMatchingSignal.packageInfo,
        ),
      ]);
    },
    execute: async () => {
      await signalsPanel.searchField.fill(
        signalSearch.matchingSignal.packageInfo.packageName!,
      );
      await Promise.all([
        signalsPanel.packageCard.assert.isVisible(
          signalSearch.matchingSignal.packageInfo,
        ),
        signalsPanel.packageCard.assert.isHidden(
          signalSearch.nonMatchingSignal.packageInfo,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.clearSearchButton.click();
      await Promise.all([
        expect(signalsPanel.searchField).toHaveValue(''),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
  });

  await runScenario({
    id: 'filter-attributions',
    title: 'filter attributions',
    setup: async () => {
      await navigateToResource({
        anchor: attributionFilter.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await Promise.all([
        attributionsPanel.packageCard.assert.isVisible(
          attributionFilter.matchingAttribution.packageInfo,
        ),
        attributionsPanel.packageCard.assert.isVisible(
          attributionFilter.nonMatchingAttribution.packageInfo,
        ),
      ]);
    },
    execute: async () => {
      await attributionsPanel.filterButton.click();
      await attributionsPanel.selectLicenseName(attributionFilter.licenseName);
      await attributionsPanel.closeFilterMenu();
      await Promise.all([
        attributionsPanel.packageCard.assert.isVisible(
          attributionFilter.matchingAttribution.packageInfo,
        ),
        attributionsPanel.packageCard.assert.isHidden(
          attributionFilter.nonMatchingAttribution.packageInfo,
        ),
        attributionsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await attributionsPanel.filterButton.click();
      await attributionsPanel.clearFilters();
      await attributionsPanel.closeFilterMenu();
      await attributionsPanel.assert.loadingIndicatorIsHidden();
    },
  });

  await runScenario({
    id: 'sort-signals',
    title: 'sort signals by occurrence',
    setup: async () => {
      await navigateToResource({
        anchor: signalSort.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await Promise.all([
        signalsPanel.packageCard.assert.isVisible(
          signalSort.frequentSignal.packageInfo,
        ),
        signalsPanel.packageCard.assert.isVisible(
          signalSort.rareSignal.packageInfo,
        ),
      ]);
    },
    execute: async () => {
      await signalsPanel.sortButton.click();
      await signalsPanel.sortings.occurrence.click();
      await signalsPanel.closeFilterMenu();
      await Promise.all([
        signalsPanel.packageCard.assert.isVisible(
          signalSort.frequentSignal.packageInfo,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.sortButton.click();
      await signalsPanel.sortings.name.click();
      await signalsPanel.closeFilterMenu();
      await signalsPanel.assert.loadingIndicatorIsHidden();
    },
  });

  await runScenario({
    id: 'open-dense-signal-list',
    title: 'open a dense signal list',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.signalSort.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await prepareResourceSelection({
        anchor: model.scenarios.denseSignals.resource,
        resourcesTree,
      });
    },
    execute: async () => {
      await selectResourceAndWaitForAudit({
        anchor: model.scenarios.denseSignals.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await Promise.all([
        signalsPanel.assert.onResourceCountIs(
          model.scenarios.denseSignals.signals.length,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await resourcesTree.clearSearch();
    },
  });

  await runScenario({
    id: 'search-dense-signal-list',
    title: 'search a dense signal list',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.denseSignals.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
    },
    execute: async () => {
      const dense = model.scenarios.denseSignals;
      await signalsPanel.searchField.fill(
        dense.searchSignal.packageInfo.packageName!,
      );
      await Promise.all([
        signalsPanel.packageCard.assert.isVisible(
          dense.searchSignal.packageInfo,
        ),
        signalsPanel.packageCard.assert.isHidden(dense.signals[0].packageInfo),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.clearSearchButton.click();
      await signalsPanel.assert.loadingIndicatorIsHidden();
    },
  });

  await runScenario({
    id: 'filter-dense-signal-list',
    title: 'filter a dense signal list',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.denseSignals.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
    },
    execute: async () => {
      const dense = model.scenarios.denseSignals;
      await signalsPanel.filterButton.click();
      await signalsPanel.selectLicenseName(dense.licenseName);
      await signalsPanel.closeFilterMenu();
      await Promise.all([
        signalsPanel.assert.onResourceCountIs(dense.bulkSignals.length),
        signalsPanel.packageCard.assert.isHidden(
          dense.signals.at(-1)!.packageInfo,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.filterButton.click();
      await signalsPanel.clearFilters();
      await signalsPanel.closeFilterMenu();
      await signalsPanel.assert.loadingIndicatorIsHidden();
    },
  });

  await runScenario({
    id: 'sort-dense-signals-by-occurrence',
    title: 'sort dense signals by occurrence',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.denseSignals.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
    },
    execute: async () => {
      await signalsPanel.sortButton.click();
      await signalsPanel.sortings.occurrence.click();
      await signalsPanel.closeFilterMenu();
      await signalsPanel.packageCard.assert.isFirstVisible(
        model.scenarios.denseSignals.frequentSignal.packageInfo,
      );
      await signalsPanel.assert.loadingIndicatorIsHidden();
    },
    teardown: async () => {
      await signalsPanel.sortButton.click();
      await signalsPanel.sortings.name.click();
      await signalsPanel.closeFilterMenu();
      await signalsPanel.assert.loadingIndicatorIsHidden();
    },
  });

  await runScenario({
    id: 'select-all-filtered-signals',
    title: 'select all bulk-operation signals',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.denseSignals.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await signalsPanel.filterButton.click();
      await signalsPanel.selectLicenseName(
        model.scenarios.denseSignals.licenseName,
      );
      await signalsPanel.closeFilterMenu();
    },
    execute: async () => {
      await signalsPanel.selectAllCheckbox.click();
      await expect(signalsPanel.selectAllCheckbox).toBeChecked();
      await signalsPanel.assert.linkButtonIsEnabled();
    },
    teardown: async () => {
      await signalsPanel.selectAllCheckbox.click();
      await signalsPanel.filterButton.click();
      await signalsPanel.clearFilters();
      await signalsPanel.closeFilterMenu();
    },
  });

  for (const mode of [
    'Attributions',
    'Criticalities',
    'Classifications',
  ] as const) {
    await runScenario({
      id: `switch-progress-mode.${mode.toLowerCase()}`,
      operation: 'switch-progress-mode',
      title: `switch progress bar to ${mode}`,
      setup: async () => {
        await topBar.selectProgressBar(
          mode === 'Attributions' ? 'Criticalities' : 'Attributions',
        );
      },
      execute: async () => {
        await topBar.selectProgressBar(mode);
        await topBar.assert.progressBarModeIs(mode);
      },
      teardown: async () => {
        await topBar.selectProgressBar('Attributions');
      },
    });
  }

  for (const mode of [
    'Attributions',
    'Criticalities',
    'Classifications',
  ] as const) {
    await runScenario({
      id: `navigate-next-review-resource.${mode.toLowerCase()}`,
      operation: 'navigate-next-review-resource',
      title: `navigate to the next ${mode.toLowerCase()} review resource`,
      setup: async () => {
        await topBar.selectProgressBar(mode);
        await topBar.assert.progressBarModeIs(mode);
      },
      execute: async () => {
        await topBar.clickProgressBar();
        await waitForAuditReady({
          attributionDetails,
          attributionsPanel,
          progressBarMode: mode,
          resourcesTree,
          signalsPanel,
          topBar,
        });
      },
      teardown: async () => {
        await topBar.selectProgressBar('Attributions');
      },
    });
  }

  await runScenario({
    id: 'navigate-to-split-resource',
    operation: 'navigate-to-split-resource',
    title: 'navigate to a split candidate resource',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.split.sourceResource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await prepareResourceSelection({
        anchor: model.scenarios.split.firstPartitionResource,
        assertEditable: false,
        resourcesTree,
      });
      await resourcesTree.assert.resourceAtPathIsEditable(
        model.scenarios.split.firstPartitionResource.resourcePath,
      );
    },
    execute: async () => {
      await selectResourceAndWaitForAudit({
        anchor: model.scenarios.split.firstPartitionResource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
    },
    teardown: async () => {
      await resourcesTree.clearSearch();
    },
  });

  await runScenario({
    id: 'open-project-statistics',
    title: 'open project statistics',
    execute: async () => {
      await menuBar.openProjectStatistics();
      await Promise.all([
        projectStatisticsPopup.assert.titleIsVisible(),
        projectStatisticsPopup.assert.overviewChartsAreVisible(),
        projectStatisticsPopup.assert.signalsByCriticalityIsVisible(
          model.scenarios.projectStatistics.criticality,
        ),
        projectStatisticsPopup.assert.signalsByClassificationContains(
          model.scenarios.projectStatistics.classification,
        ),
        projectStatisticsPopup.assert.incompleteAttributionsIsVisible(),
      ]);
    },
    teardown: async () => {
      await projectStatisticsPopup.closeButton.click();
      await projectStatisticsPopup.assert.titleIsHidden();
    },
  });

  await runScenario({
    id: 'open-report-view',
    title: 'open report view',
    execute: async () => {
      await topBar.gotoReportView();
      await Promise.all([
        topBar.assert.reportViewIsActive(),
        reportView.assert.isVisible(),
      ]);
    },
    teardown: async () => {
      await topBar.gotoAuditView();
      await topBar.assert.auditViewIsActive();
    },
  });
}
