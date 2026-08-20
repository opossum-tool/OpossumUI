// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';
import fs from 'node:fs/promises';

import {
  stubOpenDialogSync,
  stubSaveDialogSync,
} from '../../e2e-tests/utils/dialog';
import { waitForAuditReady } from './performance-test-helpers';
import type { PerformanceWorkflowContext } from './performance-workflow-context';

export async function runSplitWorkflows({
  attributionDetails,
  attributionsPanel,
  appLoadTimeout,
  confirmSavePopup,
  menuBar,
  mergeOpossumFilesDialog,
  model,
  reportView,
  resourcesTree,
  runScenario,
  signalsPanel,
  splitDialog,
  testInfo,
  topBar,
  window,
  sourcePath,
  partitionOnePath,
  partitionTwoPath,
}: PerformanceWorkflowContext): Promise<void> {
  const split = model.scenarios.split;
  await runScenario({
    id: 'create-split.one-partition',
    operation: 'create-split',
    variant: 'split-source-one-partition',
    title: 'create the first performance partition',
    setup: async () => {
      await resourcesTree.openSplitDialogAtPath(`${split.firstPartition[0]}/`);
      for (const selectedPath of split.firstPartition.slice(1)) {
        await splitDialog.toggleResourceSelection(selectedPath.split('/')[1]);
      }
      await stubSaveDialogSync(window.app, partitionOnePath);
      await splitDialog.destinationPathSelection.click();
    },
    execute: async () => {
      await splitDialog.createButton.click();
      await splitDialog.assert.succeeded(appLoadTimeout);
      await fs.access(partitionOnePath);
    },
    teardown: async () => {
      await splitDialog.closeButton.click();
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
    id: 'create-split.two-partitions',
    operation: 'create-split',
    variant: 'split-source-two-partitions',
    title: 'create the second performance partition',
    setup: async () => {
      await resourcesTree.openSplitDialogAtPath(`${split.secondPartition[0]}/`);
      for (const selectedPath of split.secondPartition.slice(1)) {
        await splitDialog.toggleResourceSelection(selectedPath.split('/')[1]);
      }
      await stubSaveDialogSync(window.app, partitionTwoPath);
      await splitDialog.destinationPathSelection.click();
    },
    execute: async () => {
      await splitDialog.createButton.click();
      await splitDialog.assert.succeeded(appLoadTimeout);
      await fs.access(partitionTwoPath);
    },
    teardown: async () => {
      await splitDialog.closeButton.click();
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
    id: 'edit-mixed-high-fanout-attribution.split-source-two-partitions',
    operation: 'edit-mixed-high-fanout-attribution',
    variant: 'split-source-two-partitions',
    title: 'edit a mixed high-fanout attribution',
    setup: async () => {
      await resourcesTree.revealResource(
        split.mixedWritableResource.resourcePath,
      );
      await resourcesTree.selectRevealedResource(
        split.mixedWritableResource.resourcePath,
      );
      await resourcesTree.clearSearch();
      await waitForAuditReady({
        attributionDetails,
        attributionsPanel,
        resourcesTree,
        signalsPanel,
        topBar,
      });
      await attributionsPanel.packageCard.click(
        model.scenarios.highFanout.manual.packageInfo,
      );
    },
    execute: async () => {
      await attributionDetails.attributionForm.comment.fill(
        `Mixed performance edit ${testInfo.repeatEachIndex}`,
      );
      await attributionDetails.saveButton.click();
      await expect(confirmSavePopup.saveLocallyButton).toBeVisible();
      await confirmSavePopup.saveLocallyButton.click();
      await confirmSavePopup.assert.isHidden();
      await attributionDetails.assert.saveButtonIsDisabled();
    },
  });

  await runScenario({
    id: 'merge-partitions',
    operation: 'merge-partitions',
    variant: 'split-source-two-partitions',
    title: 'merge both performance partitions',
    setup: async () => {
      await menuBar.openFileAndWaitForLoad(sourcePath, appLoadTimeout);
      await menuBar.mergeSplitFilesIntoCurrentFile();
      await stubOpenDialogSync(window.app, [
        partitionOnePath,
        partitionTwoPath,
      ]);
      await mergeOpossumFilesDialog.inputFileSelection.click();
    },
    execute: async () => {
      await mergeOpossumFilesDialog.merge(appLoadTimeout);
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
    id: 'open-report-view.merged',
    operation: 'open-report-view',
    variant: 'merged',
    title: 'open the report after merging partitions',
    execute: async () => {
      await topBar.gotoReportView();
      await reportView.assert.isVisible();
    },
    teardown: async () => {
      await topBar.gotoAuditView();
    },
  });
}
