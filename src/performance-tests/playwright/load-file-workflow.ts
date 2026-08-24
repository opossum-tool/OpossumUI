// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitForAuditReady } from './performance-test-helpers';
import type { PerformanceWorkflowContext } from './performance-workflow-context';

export async function runLoadFile({
  runScenario,
  menuBar,
  runFilePath,
  appLoadTimeout,
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  signalsPanel,
  topBar,
}: PerformanceWorkflowContext) {
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
}
