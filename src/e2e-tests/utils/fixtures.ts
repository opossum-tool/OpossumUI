// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  test as base,
  _electron as electron,
  ElectronApplication,
  Page,
  TestInfo,
} from '@playwright/test';
import { parseElectronApp } from 'electron-playwright-helpers';
import * as os from 'os';
import * as path from 'path';

import {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../ElectronBackend/types/types';
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { AttributionDetails } from '../page-objects/AttributionDetails';
import { AttributionsPanel } from '../page-objects/AttributionsPanel';
import { ConfirmationDialog } from '../page-objects/ConfirmationDialog';
import { ConfirmDeletePopup } from '../page-objects/ConfirmDeletePopup';
import { ConfirmReplacePopup } from '../page-objects/ConfirmReplacePopup';
import { ConfirmSavePopup } from '../page-objects/ConfirmSavePopup';
import { DiffPopup } from '../page-objects/DiffPopup';
import { ErrorPopup } from '../page-objects/ErrorPopup';
import { FileSupportPopup } from '../page-objects/FileSupportPopup';
import { ImportDialog } from '../page-objects/ImportDialog';
import { LinkedResourcesTree } from '../page-objects/LinkedResourcesTree';
import { MenuBar } from '../page-objects/MenuBar';
import { MergeDialog } from '../page-objects/MergeDialog';
import { NotSavedPopup } from '../page-objects/NotSavedPopup';
import { PathBar } from '../page-objects/PathBar';
import { ProjectMetadataPopup } from '../page-objects/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../page-objects/ProjectStatisticsPopup';
import { ReportView } from '../page-objects/ReportView';
import { ResourcesTree } from '../page-objects/ResourcesTree';
import { SignalsPanel } from '../page-objects/SignalsPanel';
import { TopBar } from '../page-objects/TopBar';

const LOAD_TIMEOUT = 15000;

interface OpossumData {
  inputData: ParsedOpossumInputFile;
  outputData?: ParsedOpossumOutputFile;
  provideImportFiles?: boolean;
}

export const test = base.extend<{
  window: Page & { app: ElectronApplication };
  /** Specify the input/output data contained in the opossum file which the app will open as part of the test. */
  data: OpossumData | undefined;
  /** Run this function at any point in a test to abort the test at that point and inspect the opossum file. */
  debug: () => void;
  modKey: string;
  attributionDetails: AttributionDetails;
  attributionsPanel: AttributionsPanel;
  confirmDeletePopup: ConfirmDeletePopup;
  confirmReplacePopup: ConfirmReplacePopup;
  confirmSavePopup: ConfirmSavePopup;
  confirmationDialog: ConfirmationDialog;
  diffPopup: DiffPopup;
  errorPopup: ErrorPopup;
  fileSupportPopup: FileSupportPopup;
  importDialog: ImportDialog;
  mergeDialog: MergeDialog;
  linkedResourcesTree: LinkedResourcesTree;
  menuBar: MenuBar;
  notSavedPopup: NotSavedPopup;
  openFromCLI: boolean;
  pathBar: PathBar;
  projectMetadataPopup: ProjectMetadataPopup;
  projectStatisticsPopup: ProjectStatisticsPopup;
  reportView: ReportView;
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
  topBar: TopBar;
}>({
  data: undefined,
  openFromCLI: true,
  window: async ({ data, openFromCLI }, use, info) => {
    const filePath = data && (await createTestFile({ data, info }));

    const [executablePath, main] = getLaunchProps();
    const args = ['--reset'];
    if (os.platform() === 'linux') {
      args.push('--no-sandbox');
    }

    const app = await electron.launch({
      args: [
        main,
        ...(!filePath || !openFromCLI ? args : args.concat([filePath])),
      ],
      executablePath,
    });

    const window = await app.firstWindow();
    await window.setViewportSize({
      width: 1920,
      height: 1080,
    });
    // eslint-disable-next-line playwright/no-networkidle
    await window.waitForLoadState('networkidle', { timeout: LOAD_TIMEOUT });
    await window
      .context()
      .tracing.start({ screenshots: true, snapshots: true });

    await use(Object.assign(window, { app }));

    await window.context().tracing.stop({
      path: info.outputPath(
        `${data?.inputData.metadata.projectId || 'app'}.trace.zip`,
      ),
    });
    await app.close();
  },
  debug: async ({ window: _ }, use, info) => {
    await use(() => {
      console.log(`DEBUG: ${info.outputPath()}`);
      info.fixme();
    });
  },
  modKey: async ({}, use) => {
    await use(os.platform() === 'darwin' ? 'Meta' : 'Control');
  },
  projectStatisticsPopup: async ({ window }, use) => {
    await use(new ProjectStatisticsPopup(window));
  },
  fileSupportPopup: async ({ window }, use) => {
    await use(new FileSupportPopup(window));
  },
  resourcesTree: async ({ window }, use) => {
    await use(new ResourcesTree(window));
  },
  pathBar: async ({ window }, use) => {
    await use(new PathBar(window));
  },
  errorPopup: async ({ window }, use) => {
    await use(new ErrorPopup(window));
  },
  topBar: async ({ window }, use) => {
    await use(new TopBar(window));
  },
  confirmReplacePopup: async ({ window }, use) => {
    await use(new ConfirmReplacePopup(window));
  },
  projectMetadataPopup: async ({ window }, use) => {
    await use(new ProjectMetadataPopup(window));
  },
  menuBar: async ({ window }, use) => {
    await use(new MenuBar(window));
  },
  confirmDeletePopup: async ({ window }, use) => {
    await use(new ConfirmDeletePopup(window));
  },
  attributionsPanel: async ({ window }, use) => {
    await use(new AttributionsPanel(window));
  },
  attributionDetails: async ({ window }, use) => {
    await use(new AttributionDetails(window));
  },
  confirmationDialog: async ({ window }, use) => {
    await use(new ConfirmationDialog(window));
  },
  notSavedPopup: async ({ window }, use) => {
    await use(new NotSavedPopup(window));
  },
  diffPopup: async ({ window }, use) => {
    await use(new DiffPopup(window));
  },
  signalsPanel: async ({ window }, use) => {
    await use(new SignalsPanel(window));
  },
  confirmSavePopup: async ({ window }, use) => {
    await use(new ConfirmSavePopup(window));
  },
  linkedResourcesTree: async ({ window }, use) => {
    await use(new LinkedResourcesTree(window));
  },
  reportView: async ({ window }, use) => {
    await use(new ReportView(window));
  },
  importDialog: async ({ window, data }, use, info) => {
    await use(
      new ImportDialog(window, data?.inputData.metadata.projectId, info),
    );
  },
  mergeDialog: async ({ window, data }, use, info) => {
    await use(
      new MergeDialog(window, data?.inputData.metadata.projectId, info),
    );
  },
});

function getLaunchProps(): [executablePath: string | undefined, main: string] {
  if (process.env.CI || process.env.RELEASE) {
    const appInfo = parseElectronApp(getReleasePath());
    return [appInfo.executable, appInfo.main];
  }

  return [undefined, 'build/ElectronBackend/app.js'];
}

function getReleasePath(): string {
  if (os.platform() === 'win32') {
    return path.join(__dirname, '..', '..', '..', 'release', 'win-unpacked');
  } else if (os.platform() === 'darwin') {
    if (os.arch() === 'arm64') {
      return path.join(__dirname, '..', '..', '..', 'release', 'mac-arm64');
    }
    return path.join(__dirname, '..', '..', '..', 'release', 'mac');
  } else if (os.platform() === 'linux') {
    return path.join(__dirname, '..', '..', '..', 'release', 'linux-unpacked');
  }

  throw new Error('Unsupported platform');
}

async function createTestFile({
  data: { inputData, outputData, provideImportFiles },
  info,
}: {
  data: OpossumData;
  info: TestInfo;
}): Promise<string> {
  const filename = inputData.metadata.projectId;

  if (provideImportFiles) {
    await writeFile({
      path: info.outputPath(`${filename}.json`),
      content: inputData,
    });
  }

  return writeOpossumFile({
    input: inputData,
    path: info.outputPath(`${filename}.opossum`),
    output: outputData,
  });
}
