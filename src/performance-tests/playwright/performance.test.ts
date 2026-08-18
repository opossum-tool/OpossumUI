// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { runMutationWorkflows } from './mutation-performance-workflows';
import { test } from './performance-test-harness';
import { createPerformanceWorkflowContext } from './performance-workflow-context';
import { runResourceWorkflows } from './resource-performance-workflows';
import { runSplitWorkflows } from './split-performance-workflows';

test('measures representative performance workflows', async ({
  attributionDetails,
  attributionsPanel,
  appLoadTimeout,
  confirmSavePopup,
  menuBar,
  mergeOpossumFilesDialog,
  pathBar,
  runScenario,
  projectStatisticsPopup,
  performanceProfile,
  reportView,
  resourcesTree,
  runFilePath,
  signalsPanel,
  splitDialog,
  topBar,
  window,
}, testInfo) => {
  const workflowContext = createPerformanceWorkflowContext({
    attributionDetails,
    attributionsPanel,
    appLoadTimeout,
    confirmSavePopup,
    menuBar,
    mergeOpossumFilesDialog,
    pathBar,
    projectStatisticsPopup,
    performanceProfile,
    reportView,
    resourcesTree,
    runFilePath,
    runScenario,
    signalsPanel,
    splitDialog,
    testInfo,
    topBar,
    window,
  });

  await runResourceWorkflows(workflowContext);
  await runMutationWorkflows(workflowContext);
  await runSplitWorkflows(workflowContext);
});
