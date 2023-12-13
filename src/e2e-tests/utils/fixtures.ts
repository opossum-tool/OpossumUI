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
import { AttributionFilters } from '../page-objects/AttributionFilters';
import { AttributionList } from '../page-objects/AttributionList';
import { ChangePreferredStatusGloballyPopup } from '../page-objects/ChangePreferredStatusGloballyPopup';
import { ConfirmationPopup } from '../page-objects/ConfirmationPopup';
import { EditAttributionPopup } from '../page-objects/EditAttributionPopup';
import { ErrorPopup } from '../page-objects/ErrorPopup';
import { FileSearchPopup } from '../page-objects/FileSearchPopup';
import { FileSupportPopup } from '../page-objects/FileSupportPopup';
import { MenuBar } from '../page-objects/MenuBar';
import { ModifyWasPreferredAttributionPopup } from '../page-objects/ModifyWasPreferredAttributionPopup';
import { NotSavedPopup } from '../page-objects/NotSavedPopup';
import { ProjectMetadataPopup } from '../page-objects/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../page-objects/ProjectStatisticsPopup';
import { ReplaceAttributionPopup } from '../page-objects/ReplaceAttributionPopup';
import { ReportView } from '../page-objects/ReportView';
import { ResourceBrowser } from '../page-objects/ResourceBrowser';
import { ResourceDetails } from '../page-objects/ResourceDetails';
import { ResourcePathPopup } from '../page-objects/ResourcePathPopup';
import { TopBar } from '../page-objects/TopBar';

const LOAD_TIMEOUT = 15000;

interface OpossumData {
  inputData: ParsedOpossumInputFile;
  outputData?: ParsedOpossumOutputFile;
  decompress?: boolean;
}

export { expect } from '@playwright/test';
export const test = base.extend<{
  window: Page & { app: ElectronApplication };
  /** Specify the input/output data contained in the opossum file which the app will open as part of the test. */
  data: OpossumData | undefined;
  /** Run this function at any point in a test to abort the test at that point and inspect the opossum file. */
  debug: () => void;
  attributionDetails: AttributionDetails;
  attributionFilters: AttributionFilters;
  attributionList: AttributionList;
  changePreferredStatusGloballyPopup: ChangePreferredStatusGloballyPopup;
  confirmationPopup: ConfirmationPopup;
  editAttributionPopup: EditAttributionPopup;
  errorPopup: ErrorPopup;
  fileSearchPopup: FileSearchPopup;
  fileSupportPopup: FileSupportPopup;
  menuBar: MenuBar;
  modKey: string;
  modifyWasPreferredAttributionPopup: ModifyWasPreferredAttributionPopup;
  notSavedPopup: NotSavedPopup;
  projectMetadataPopup: ProjectMetadataPopup;
  projectStatisticsPopup: ProjectStatisticsPopup;
  replaceAttributionPopup: ReplaceAttributionPopup;
  reportView: ReportView;
  resourceBrowser: ResourceBrowser;
  resourceDetails: ResourceDetails;
  resourcePathPopup: ResourcePathPopup;
  topBar: TopBar;
}>({
  data: undefined,
  window: async ({ data }, use, info) => {
    const filePath = data && (await createTestFile({ data, info }));

    const [executablePath, main] = getLaunchProps();
    const args = ['--reset'];

    const app = await electron.launch({
      args: [main, ...(!filePath ? args : args.concat([filePath]))],
      executablePath,
    });

    const window = await app.firstWindow();
    // eslint-disable-next-line playwright/no-networkidle
    await window.waitForLoadState('networkidle', { timeout: LOAD_TIMEOUT });
    await window
      .context()
      .tracing.start({ screenshots: true, snapshots: true });

    await use(Object.assign(window, { app }));

    await window.context().tracing.stop({
      path: info.error
        ? info.outputPath(
            `${data?.inputData.metadata.projectId || 'app'}.trace.zip`,
          )
        : undefined,
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
  resourceBrowser: async ({ window }, use) => {
    await use(new ResourceBrowser(window));
  },
  resourceDetails: async ({ window }, use) => {
    await use(new ResourceDetails(window));
  },
  errorPopup: async ({ window }, use) => {
    await use(new ErrorPopup(window));
  },
  topBar: async ({ window }, use) => {
    await use(new TopBar(window));
  },
  replaceAttributionPopup: async ({ window }, use) => {
    await use(new ReplaceAttributionPopup(window));
  },
  projectMetadataPopup: async ({ window }, use) => {
    await use(new ProjectMetadataPopup(window));
  },
  menuBar: async ({ window }, use) => {
    await use(new MenuBar(window));
  },
  fileSearchPopup: async ({ window }, use) => {
    await use(new FileSearchPopup(window));
  },
  changePreferredStatusGloballyPopup: async ({ window }, use) => {
    await use(new ChangePreferredStatusGloballyPopup(window));
  },
  confirmationPopup: async ({ window }, use) => {
    await use(new ConfirmationPopup(window));
  },
  attributionList: async ({ window }, use) => {
    await use(new AttributionList(window));
  },
  resourcePathPopup: async ({ window }, use) => {
    await use(new ResourcePathPopup(window));
  },
  attributionDetails: async ({ window }, use) => {
    await use(new AttributionDetails(window));
  },
  attributionFilters: async ({ window }, use) => {
    await use(new AttributionFilters(window));
  },
  reportView: async ({ window }, use) => {
    await use(new ReportView(window));
  },
  modifyWasPreferredAttributionPopup: async ({ window }, use) => {
    await use(new ModifyWasPreferredAttributionPopup(window));
  },
  notSavedPopup: async ({ window }, use) => {
    await use(new NotSavedPopup(window));
  },
  editAttributionPopup: async ({ window }, use) => {
    await use(new EditAttributionPopup(window));
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
    return path.join(__dirname, '..', '..', '..', 'release', 'mac');
  } else if (os.platform() === 'linux') {
    return path.join(__dirname, '..', '..', '..', 'release', 'linux-unpacked');
  }

  throw new Error('Unsupported platform');
}

function createTestFile({
  data: { inputData, outputData, decompress },
  info,
}: {
  data: OpossumData;
  info: TestInfo;
}): Promise<string> {
  const filename = inputData.metadata.projectId;

  if (decompress) {
    return writeFile({
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
