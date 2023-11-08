// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  test as base,
  _electron as electron,
  ElectronApplication,
  Page,
} from '@playwright/test';
import { parseElectronApp } from 'electron-playwright-helpers';
import * as os from 'os';
import * as path from 'path';

import { AttributionDetails } from '../page-objects/AttributionDetails';
import { AttributionList } from '../page-objects/AttributionList';
import { ConfirmationPopup } from '../page-objects/ConfirmationPopup';
import { ErrorPopup } from '../page-objects/ErrorPopup';
import { FileSearchPopup } from '../page-objects/FileSearchPopup';
import { FileSupportPopup } from '../page-objects/FileSupportPopup';
import { MenuBar } from '../page-objects/MenuBar';
import { ProjectMetadataPopup } from '../page-objects/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../page-objects/ProjectStatisticsPopup';
import { ReplaceAttributionPopup } from '../page-objects/ReplaceAttributionPopup';
import { ResourceBrowser } from '../page-objects/ResourceBrowser';
import { ResourceDetails } from '../page-objects/ResourceDetails';
import { ResourcePathPopup } from '../page-objects/ResourcePathPopup';
import { TopBar } from '../page-objects/TopBar';
import { createOpossumFile, OpossumData } from './opossum-files';

const LOAD_TIMEOUT = 15000;

export { expect } from '@playwright/test';
export const test = base.extend<{
  window: Page & { app: ElectronApplication };
  data: OpossumData | undefined;
  attributionDetails: AttributionDetails;
  attributionList: AttributionList;
  confirmationPopup: ConfirmationPopup;
  errorPopup: ErrorPopup;
  fileSearchPopup: FileSearchPopup;
  fileSupportPopup: FileSupportPopup;
  menuBar: MenuBar;
  projectMetadataPopup: ProjectMetadataPopup;
  projectStatisticsPopup: ProjectStatisticsPopup;
  replaceAttributionPopup: ReplaceAttributionPopup;
  resourceBrowser: ResourceBrowser;
  resourceDetails: ResourceDetails;
  resourcePathPopup: ResourcePathPopup;
  topBar: TopBar;
}>({
  data: undefined,
  window: async ({ data }, use) => {
    const filename = data && (await createOpossumFile(data));

    const [executablePath, main] = getLaunchProps();

    const app = await electron.launch({
      args: [main, ...(filename ? [filename] : [])],
      executablePath,
    });

    const window = await app.firstWindow();
    // eslint-disable-next-line playwright/no-networkidle
    await window.waitForLoadState('networkidle', { timeout: LOAD_TIMEOUT });

    await use(Object.assign(window, { app }));

    await app.close();
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
});

function getLaunchProps(): [executablePath: string | undefined, main: string] {
  if (process.env.CI) {
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
