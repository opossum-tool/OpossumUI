// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { getSyntheticAttributionLinkCounts } from '../synthetic-file/fixture';
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

async function prepareHighFanoutLinkedResources(
  context: PerformanceWorkflowContext,
  resource = context.model.scenarios.highFanout.resource,
): Promise<void> {
  const {
    attributionDetails,
    attributionsPanel,
    linkedResourcesTree,
    model,
    resourcesTree,
    signalsPanel,
  } = context;
  const highFanout = model.scenarios.highFanout;

  await navigateToResource({
    anchor: resource,
    assertEditable: false,
    attributionDetails,
    attributionsPanel,
    resourcesTree,
    signalsPanel,
  });
  await linkedResourcesTree.clearSearch();
  await attributionsPanel.packageCard.click(highFanout.manual.packageInfo);
  await Promise.all([
    attributionDetails.attributionForm.assert.matchesPackageInfo(
      highFanout.manual.packageInfo,
    ),
    attributionDetails.assert.loadingIndicatorIsHidden(),
    linkedResourcesTree.assert.isVisible(),
    linkedResourcesTree.waitForLoadingToFinish(),
  ]);
}

export async function runResourceWorkflows(
  context: PerformanceWorkflowContext,
): Promise<void> {
  const {
    model,
    attributionDetails,
    attributionsPanel,
    linkedResourcesTree,
    menuBar,
    pathBar,
    projectStatisticsPopup,
    reportView,
    resourcesTree,
    runScenario,
    signalsPanel,
    topBar,
  } = context;
  const expandAndSelectScenario = model.scenarios.expandAndSelect;
  const expandAndSelectAnchors = expandAndSelectScenario.anchors;
  const expectedContent = expandAndSelectScenario.expected;
  const searchAnchors = model.scenarios.resourceSearch.anchors;
  const resourceFilter = model.scenarios.resourceFilter;
  const attributionFilter = model.scenarios.attributionFilter;
  const signalSearch = model.scenarios.signalSearch;
  const signalSort = model.scenarios.signalSort;
  const highFanout = model.scenarios.highFanout;
  const linkedResourceTargets = highFanout.linkedResourceTargets;
  const expansionBranchPath = `/${linkedResourceTargets.expansion.resource.resourceNames[0]}/`;
  const expansionChildPath = `/${linkedResourceTargets.expansion.resource.resourceNames[0]}/${linkedResourceTargets.expansion.resource.resourceNames[1]}/`;
  const linkCounts = getSyntheticAttributionLinkCounts(
    model.profile,
    model,
    'external',
  );
  const getLinkCount = (signalId: string): number => {
    const count = linkCounts.get(signalId);
    if (count === undefined) {
      throw new Error(
        `No generated linked resources for attribution ${signalId}.`,
      );
    }
    return count;
  };
  const targetCounts = {
    open: getLinkCount(linkedResourceTargets.open.signal.id),
    search: getLinkCount(linkedResourceTargets.search.signal.id),
    expansion: getLinkCount(linkedResourceTargets.expansion.signal.id),
  };

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
      await resourcesTree.search(searchAnchors.targetResourceName);
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
      await resourcesTree.clearSearch();
      await resourcesTree.assert.resourceIsVisible(
        expandAndSelectAnchors.targetResourceName,
      );
    },
  });

  await runScenario({
    id: 'open-high-fanout-attribution-details',
    title: 'open high-fanout attribution details',
    setup: async () => {
      await prepareHighFanoutLinkedResources(context);
      await signalsPanel.packageCard.assert.isVisible(
        highFanout.external.packageInfo,
      );
    },
    execute: async () => {
      await signalsPanel.packageCard.click(highFanout.external.packageInfo);
      await Promise.all([
        attributionDetails.attributionForm.assert.matchesPackageInfo(
          highFanout.external.packageInfo,
        ),
        attributionDetails.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await linkedResourcesTree.waitForLoadingToFinish();
    },
  });

  await runScenario({
    id: 'open-high-fanout-linked-resources',
    title: 'open high-fanout linked resources',
    setup: async () => {
      await prepareHighFanoutLinkedResources(
        context,
        linkedResourceTargets.open.resource,
      );
      await signalsPanel.packageCard.assert.isVisible(
        linkedResourceTargets.open.signal.packageInfo,
      );
    },
    execute: async () => {
      await signalsPanel.packageCard.click(
        linkedResourceTargets.open.signal.packageInfo,
      );
      await Promise.all([
        attributionDetails.attributionForm.assert.matchesPackageInfo(
          linkedResourceTargets.open.signal.packageInfo,
        ),
        attributionDetails.assert.loadingIndicatorIsHidden(),
        linkedResourcesTree.assert.isVisible(),
        linkedResourcesTree.assert.totalCountIs(targetCounts.open),
        linkedResourcesTree.waitForLoadingToFinish(),
      ]);
    },
  });

  await runScenario({
    id: 'search-high-fanout-linked-resources',
    title: 'search high-fanout linked resources',
    setup: async () => {
      await prepareHighFanoutLinkedResources(
        context,
        linkedResourceTargets.search.resource,
      );
      await signalsPanel.packageCard.click(
        linkedResourceTargets.search.signal.packageInfo,
      );
      await Promise.all([
        attributionDetails.attributionForm.assert.matchesPackageInfo(
          linkedResourceTargets.search.signal.packageInfo,
        ),
        attributionDetails.assert.loadingIndicatorIsHidden(),
        linkedResourcesTree.assert.isVisible(),
        linkedResourcesTree.assert.totalCountIs(targetCounts.search),
        linkedResourcesTree.waitForLoadingToFinish(),
      ]);
    },
    execute: async () => {
      await linkedResourcesTree.search(
        linkedResourceTargets.search.resource.resourceName,
      );
      await Promise.all([
        linkedResourcesTree.assert.resourceIsVisible(
          linkedResourceTargets.search.resource.resourceName,
        ),
        linkedResourcesTree.assert.totalCountIs(1),
        linkedResourcesTree.waitForLoadingToFinish(),
      ]);
    },
    teardown: async () => {
      await linkedResourcesTree.clearSearch();
      await linkedResourcesTree.waitForLoadingToFinish();
      await linkedResourcesTree.assert.totalCountIs(targetCounts.search);
      await linkedResourcesTree.assert.resourceIsVisible(
        linkedResourceTargets.search.resource.resourceName,
      );
    },
  });

  await runScenario({
    id: 'expand-high-fanout-linked-resources',
    title: 'expand a high-fanout linked resource branch',
    setup: async () => {
      await prepareHighFanoutLinkedResources(
        context,
        linkedResourceTargets.expansion.resource,
      );
      await signalsPanel.packageCard.click(
        linkedResourceTargets.expansion.signal.packageInfo,
      );
      await Promise.all([
        attributionDetails.attributionForm.assert.matchesPackageInfo(
          linkedResourceTargets.expansion.signal.packageInfo,
        ),
        attributionDetails.assert.loadingIndicatorIsHidden(),
        linkedResourcesTree.assert.totalCountIs(targetCounts.expansion),
        linkedResourcesTree.waitForLoadingToFinish(),
      ]);
      await linkedResourcesTree.scrollToTop();
      await linkedResourcesTree.assert.resourceAtPathIsVisible(
        expansionBranchPath,
      );
      await linkedResourcesTree.ensureResourceCollapsed(expansionBranchPath);
      await linkedResourcesTree.waitForLoadingToFinish();
      await linkedResourcesTree.assert.resourceAtPathIsHidden(
        expansionChildPath,
      );
    },
    execute: async () => {
      await linkedResourcesTree.expandResourceAtPath(expansionBranchPath);
      await Promise.all([
        linkedResourcesTree.assert.resourceAtPathIsVisible(expansionChildPath),
        linkedResourcesTree.assert.totalCountIs(targetCounts.expansion),
        linkedResourcesTree.waitForLoadingToFinish(),
      ]);
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
        signalsPanel.packageCard.assert.isFirstVisible(
          signalSort.rareSignal.packageInfo,
        ),
      ]);
      await signalsPanel.openSortMenu();
    },
    execute: async () => {
      await signalsPanel.sortings.occurrence.click();
      await Promise.all([
        signalsPanel.packageCard.assert.isFirstVisible(
          signalSort.frequentSignal.packageInfo,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.closeFilterMenu();
      await signalsPanel.sortButton.click();
      await signalsPanel.sortings.name.click();
      await signalsPanel.closeFilterMenu();
      await signalsPanel.packageCard.assert.isFirstVisible(
        signalSort.rareSignal.packageInfo,
      );
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
      await signalsPanel.packageCard.assert.isNotFirstVisible(
        model.scenarios.denseSignals.frequentSignal.packageInfo,
      );
      await signalsPanel.openSortMenu();
    },
    execute: async () => {
      await signalsPanel.sortings.occurrence.click();
      await Promise.all([
        signalsPanel.packageCard.assert.isFirstVisible(
          model.scenarios.denseSignals.frequentSignal.packageInfo,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.closeFilterMenu();
      await signalsPanel.sortButton.click();
      await signalsPanel.sortings.name.click();
      await signalsPanel.closeFilterMenu();
      await signalsPanel.packageCard.assert.isNotFirstVisible(
        model.scenarios.denseSignals.frequentSignal.packageInfo,
      );
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
