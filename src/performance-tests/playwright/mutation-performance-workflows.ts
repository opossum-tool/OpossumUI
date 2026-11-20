// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { ConfirmReplacePopup } from '../../e2e-tests/page-objects/ConfirmReplacePopup';
import { navigateToResource } from './performance-test-helpers';
import type { PerformanceWorkflowContext } from './performance-workflow-context';

export async function runMutationWorkflows({
  attributionDetails,
  attributionsPanel,
  appLoadTimeout,
  confirmSavePopup,
  model,
  resourcesTree,
  runScenario,
  signalsPanel,
  testInfo,
  topBar,
  window,
}: PerformanceWorkflowContext): Promise<void> {
  const linkScenario = model.scenarios.link;
  const editScenario = model.scenarios.edit;
  const denseSignalResourceInitialAttributionCount = 1;
  await runScenario({
    id: 'link-signal',
    title: 'link a signal as an attribution',
    setup: async () => {
      await navigateToResource({
        anchor: linkScenario.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await signalsPanel.packageCard.assert.isVisible(
        linkScenario.attribution.packageInfo,
      );
      await attributionsPanel.packageCard.assert.isHidden(
        linkScenario.attribution.packageInfo,
      );
      await signalsPanel.packageCard
        .checkbox(linkScenario.attribution.packageInfo)
        .check();
      await signalsPanel.assert.linkButtonIsEnabled();
    },
    execute: async () => {
      await signalsPanel.linkButton.click();
      await Promise.all([
        attributionsPanel.packageCard.assert.isVisible(
          linkScenario.attribution.packageInfo,
        ),
        signalsPanel.assert.linkButtonIsNotLoading(),
        attributionsPanel.assert.loadingIndicatorIsHidden(),
        signalsPanel.assert.loadingIndicatorIsHidden(),
        attributionDetails.assert.loadingIndicatorIsHidden(),
      ]);
      await signalsPanel.assert.linkButtonIsDisabled();
    },
  });

  await runScenario({
    id: 'edit-and-save-attribution',
    title: 'edit and save an attribution',
    setup: async () => {
      await navigateToResource({
        anchor: editScenario.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await attributionsPanel.packageCard.click(
        editScenario.attribution.packageInfo,
      );
      await attributionDetails.attributionForm.comment.fill(
        `Performance edit ${testInfo.repeatEachIndex}`,
      );
    },
    execute: async () => {
      await attributionDetails.saveButton.click();
      await confirmSavePopup.saveGloballyButton.click();
      await confirmSavePopup.assert.isHidden();
      await attributionDetails.assert.saveButtonIsDisabled();
    },
  });

  await runScenario({
    id: 'edit-high-fanout-attribution',
    title: 'edit a high-fanout attribution globally',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.highFanout.writableResource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await attributionsPanel.packageCard.click(
        model.scenarios.highFanout.manual.packageInfo,
      );
      await attributionDetails.attributionForm.comment.fill(
        `High fanout performance edit ${testInfo.repeatEachIndex}`,
      );
    },
    execute: async () => {
      await attributionDetails.saveButton.click();
      await confirmSavePopup.saveGloballyButton.click();
      await confirmSavePopup.assert.isHidden();
      await attributionDetails.assert.saveButtonIsDisabled();
    },
  });

  await runScenario({
    id: 'resolve-high-fanout-signal',
    title: 'resolve a high-fanout signal',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.highFanout.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await signalsPanel.packageCard.click(
        model.scenarios.highFanout.external.packageInfo,
      );
    },
    execute: async () => {
      await attributionDetails.deleteButton.click();
      await signalsPanel.packageCard.assert.isHidden(
        model.scenarios.highFanout.external.packageInfo,
      );
      await Promise.all([
        signalsPanel.assert.loadingIndicatorIsHidden(),
        attributionsPanel.assert.loadingIndicatorIsHidden(),
        topBar.assert.progressBarModeIs('Attributions'),
      ]);
    },
  });

  await runScenario({
    id: 'bulk-link-signals',
    title: 'link all filtered bulk-operation signals',
    setup: async () => {
      await navigateToResource({
        anchor: model.scenarios.denseSignals.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await signalsPanel.filterByLicense(
        model.scenarios.denseSignals.licenseName,
      );
      await signalsPanel.selectAllCheckbox.click();
      await attributionsPanel.assert.onResourceCountIs(
        denseSignalResourceInitialAttributionCount,
      );
    },
    execute: async () => {
      await signalsPanel.linkButton.click();
      await Promise.all([
        signalsPanel.assert.selectAllCheckboxIsUnchecked(appLoadTimeout),
        signalsPanel.assert.linkButtonIsDisabled(),
        attributionsPanel.assert.onResourceCountIs(
          denseSignalResourceInitialAttributionCount +
            model.scenarios.denseSignals.bulkSignals.length,
          appLoadTimeout,
        ),
        signalsPanel.assert.loadingIndicatorIsHidden(),
        attributionsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await signalsPanel.filterButton.click();
      await signalsPanel.clearFilters();
      await signalsPanel.closeFilterMenu();
    },
  });

  const replaceScenario = model.scenarios.replace;
  const confirmReplacePopup = new ConfirmReplacePopup(window);
  let preselectedFilterApplied = false;

  await runScenario({
    id: 'replace-high-fanout-attribution',
    title: 'replace a high-fanout attribution with a preselected attribution',
    setup: async () => {
      await navigateToResource({
        anchor: replaceScenario.resource,
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
      });
      await attributionsPanel.searchField.fill(
        replaceScenario.source.packageInfo.packageName!,
      );
      await expect(
        attributionsPanel.packageCard.node(replaceScenario.source.packageInfo),
      ).toHaveCount(1);
      await attributionsPanel.selectAllCheckbox.click();
      await expect(attributionsPanel.replaceButton).toBeEnabled();
      await attributionsPanel.replaceButton.click();
      await attributionsPanel.clearSearchButton.click();
      await attributionsPanel.tabs.unrelated.click();
      await attributionsPanel.filterButton.click();
      await attributionsPanel.filters.preSelected.click();
      preselectedFilterApplied = true;
      await attributionsPanel.closeFilterMenu();
      await attributionsPanel.searchField.fill(
        replaceScenario.replacement.packageInfo.packageName!,
      );
      await expect(
        attributionsPanel.packageCard.node(
          replaceScenario.replacement.packageInfo,
        ),
      ).toHaveCount(1);
      await attributionsPanel.packageCard.click(
        replaceScenario.replacement.packageInfo,
      );
      await attributionDetails.replaceButton.click();
      await confirmReplacePopup.assert.isVisible();
      await expect(confirmReplacePopup.replaceButton).toBeEnabled();
    },
    execute: async () => {
      await confirmReplacePopup.replaceButton.click();
      await confirmReplacePopup.assert.isHidden();
      await Promise.all([
        attributionsPanel.assert.selectedAttributionIs(
          replaceScenario.replacement.id,
        ),
        attributionsPanel.assert.loadingIndicatorIsHidden(),
        attributionDetails.assert.loadingIndicatorIsHidden(),
        signalsPanel.assert.loadingIndicatorIsHidden(),
      ]);
    },
    teardown: async () => {
      await attributionsPanel.searchField.fill('');
      if (preselectedFilterApplied) {
        if (!(await attributionsPanel.filterMenu.isVisible())) {
          await attributionsPanel.filterButton.click();
        }
        await attributionsPanel.filters.preSelected.click();
        await attributionsPanel.closeFilterMenu();
      }
    },
  });
}
