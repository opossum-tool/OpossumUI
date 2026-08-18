// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ElectronApplication, Page, TestInfo } from '@playwright/test';

import type { AttributionDetails } from '../../e2e-tests/page-objects/AttributionDetails';
import type { AttributionsPanel } from '../../e2e-tests/page-objects/AttributionsPanel';
import type { ConfirmSavePopup } from '../../e2e-tests/page-objects/ConfirmSavePopup';
import type { MenuBar } from '../../e2e-tests/page-objects/MenuBar';
import type { MergeOpossumFilesDialog } from '../../e2e-tests/page-objects/MergeOpossumFilesDialog';
import type { PathBar } from '../../e2e-tests/page-objects/PathBar';
import type { ProjectStatisticsPopup } from '../../e2e-tests/page-objects/ProjectStatisticsPopup';
import type { ReportView } from '../../e2e-tests/page-objects/ReportView';
import type { ResourcesTree } from '../../e2e-tests/page-objects/ResourcesTree';
import type { SignalsPanel } from '../../e2e-tests/page-objects/SignalsPanel';
import type { SplitDialog } from '../../e2e-tests/page-objects/SplitDialog';
import type { TopBar } from '../../e2e-tests/page-objects/TopBar';
import { createSyntheticFileModel } from '../synthetic-file/fixture';
import type { SyntheticFileProfile } from '../synthetic-file/profiles';
import type { RunScenario } from './performance-test-harness';

export type PerformanceWorkflowContext = {
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  appLoadTimeout: number;
  confirmSavePopup: ConfirmSavePopup;
  menuBar: MenuBar;
  mergeOpossumFilesDialog: MergeOpossumFilesDialog;
  pathBar: PathBar;
  projectStatisticsPopup: ProjectStatisticsPopup;
  performanceProfile: SyntheticFileProfile;
  reportView: ReportView;
  resourcesTree: ResourcesTree;
  runFilePath: string;
  runScenario: RunScenario;
  signalsPanel: SignalsPanel;
  splitDialog: SplitDialog;
  testInfo: TestInfo;
  topBar: TopBar;
  window: Page & { app: ElectronApplication };
  model: ReturnType<typeof createSyntheticFileModel>;
  sourcePath: string;
  partitionOnePath: string;
  partitionTwoPath: string;
};

export function createPerformanceWorkflowContext(
  context: Omit<
    PerformanceWorkflowContext,
    'model' | 'sourcePath' | 'partitionOnePath' | 'partitionTwoPath'
  >,
): PerformanceWorkflowContext {
  return {
    ...context,
    model: createSyntheticFileModel(context.performanceProfile),
    sourcePath: context.runFilePath,
    partitionOnePath: context.testInfo.outputPath('partition-1.opossum'),
    partitionTwoPath: context.testInfo.outputPath('partition-2.opossum'),
  };
}
