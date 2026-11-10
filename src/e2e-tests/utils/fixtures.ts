// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  test as base,
  _electron as electron,
  type ElectronApplication,
  type Page,
  type TestFixture,
} from '@playwright/test';
import { parseElectronApp } from 'electron-playwright-helpers';
import * as fs from 'fs';
import { performance } from 'node:perf_hooks';
import * as os from 'os';
import * as path from 'path';

import type {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../ElectronBackend/types/types';
import type { ReadonlyRule } from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import { AttributionDetails } from '../page-objects/AttributionDetails';
import { AttributionsPanel } from '../page-objects/AttributionsPanel';
import { ConfirmationDialog } from '../page-objects/ConfirmationDialog';
import { ConfirmDeletePopup } from '../page-objects/ConfirmDeletePopup';
import { ConfirmReplacePopup } from '../page-objects/ConfirmReplacePopup';
import { ConfirmSavePopup } from '../page-objects/ConfirmSavePopup';
import { DiffPopup } from '../page-objects/DiffPopup';
import { ErrorPopup } from '../page-objects/ErrorPopup';
import { FileSupportPopup } from '../page-objects/FileSupportPopup';
import { ForceUnlockPopup } from '../page-objects/ForceUnlockPopup';
import { ImportDialog } from '../page-objects/ImportDialog';
import { LinkedResourcesTree } from '../page-objects/LinkedResourcesTree';
import { MenuBar } from '../page-objects/MenuBar';
import { MergeOpossumFilesDialog } from '../page-objects/MergeOpossumFilesDialog';
import { NotSavedPopup } from '../page-objects/NotSavedPopup';
import { PathBar } from '../page-objects/PathBar';
import { ProjectMetadataPopup } from '../page-objects/ProjectMetadataPopup';
import { ProjectStatisticsPopup } from '../page-objects/ProjectStatisticsPopup';
import { ReportView } from '../page-objects/ReportView';
import { ResourcesTree } from '../page-objects/ResourcesTree';
import { SignalsPanel } from '../page-objects/SignalsPanel';
import { SplitDialog } from '../page-objects/SplitDialog';
import { TopBar } from '../page-objects/TopBar';
import { WhatsNewPopup } from '../page-objects/whats-new-popup';
import {
  getUnexpectedSyncDialogCalls,
  installDefaultSyncDialogStubs,
} from './dialog';

const LOAD_TIMEOUT = 45000;

// When a test relaunches the app, artifacts of the app sessions are
// distinguished by these suffixes so that they are all kept.
const BEFORE_RELAUNCH_ARTIFACT_SUFFIX = '.pre-relaunch';
const AFTER_RELAUNCH_ARTIFACT_SUFFIX = '.post-relaunch';

interface OpossumData {
  inputData: ParsedOpossumInputFile;
  outputData?: ParsedOpossumOutputFile;
  readonlyRules?: ReadonlyRule[];
}

/** The state needed to launch, use and close one app session. */
interface AppSession {
  app: ElectronApplication;
  window: Page;
  mainProcessLogs: Array<string>;
  tracingActive: boolean;
}

interface FilePaths {
  opossum: string;
  json: string;
}

type AppWindow = Page & { app: ElectronApplication };

const pageObjectConstructors = {
  attributionDetails: AttributionDetails,
  attributionsPanel: AttributionsPanel,
  confirmDeletePopup: ConfirmDeletePopup,
  confirmReplacePopup: ConfirmReplacePopup,
  confirmSavePopup: ConfirmSavePopup,
  confirmationDialog: ConfirmationDialog,
  diffPopup: DiffPopup,
  errorPopup: ErrorPopup,
  fileSupportPopup: FileSupportPopup,
  forceUnlockPopup: ForceUnlockPopup,
  importDialog: ImportDialog,
  linkedResourcesTree: LinkedResourcesTree,
  menuBar: MenuBar,
  mergeOpossumFilesDialog: MergeOpossumFilesDialog,
  notSavedPopup: NotSavedPopup,
  pathBar: PathBar,
  projectMetadataPopup: ProjectMetadataPopup,
  projectStatisticsPopup: ProjectStatisticsPopup,
  reportView: ReportView,
  resourcesTree: ResourcesTree,
  signalsPanel: SignalsPanel,
  splitDialog: SplitDialog,
  topBar: TopBar,
  whatsNewPopup: WhatsNewPopup,
};

type PageObjects = {
  [K in keyof typeof pageObjectConstructors]: InstanceType<
    (typeof pageObjectConstructors)[K]
  >;
};

const pageObjectFixtures = Object.fromEntries(
  Object.entries(pageObjectConstructors).map(([name, PageObject]) => [
    name,
    async (
      { window }: { window: AppWindow },
      use: (pageObject: PageObjects[keyof PageObjects]) => Promise<void>,
    ) => {
      await use(new PageObject(window));
    },
  ]),
) as unknown as {
  [K in keyof PageObjects]: TestFixture<PageObjects[K], { window: AppWindow }>;
};

function createPageObjects(window: AppWindow): PageObjects {
  return Object.fromEntries(
    Object.entries(pageObjectConstructors).map(([name, PageObject]) => [
      name,
      new PageObject(window),
    ]),
  ) as PageObjects;
}

export const test = base.extend<
  PageObjects & {
    window: AppWindow & {
      startupDurationMs: number | null;
      /** Closes the app and relaunches it with the same user data directory (no reset, no file). */
      relaunch: () => Promise<AppWindow>;
    };
    /** Specify the input/output data contained in the opossum file which the app will open as part of the test. */
    data: OpossumData | undefined;
    /** Open an existing file instead of creating a test file. */
    existingFilePath: string | null;
    /** Override the release application path used by release E2E runs. */
    releasePathOverride: string | null;
    /** Enable the Playwright trace collected by regular E2E tests. */
    playwrightTracing: boolean;
    /** Timeout for loading an existing file into the application. */
    appLoadTimeout: number;
    /** Measure process launch until the empty application is ready for a file. */
    measureStartup: boolean;
    /** Show the automatic announcement on the initial app launch. */
    showStartupWhatsNew: boolean;
    /** Run this function at any point in a test to abort the test at that point and inspect the opossum file. */
    debug: () => void;
    modKey: string;
    filePaths: FilePaths | null;
    openFromCLI: boolean;
    /** Closes the app and relaunches it */
    relaunch: () => Promise<
      PageObjects & {
        window: AppWindow;
      }
    >;
  }
>({
  ...pageObjectFixtures,
  data: undefined,
  existingFilePath: [null, { option: true }],
  releasePathOverride: [null, { option: true }],
  playwrightTracing: [true, { option: true }],
  appLoadTimeout: [LOAD_TIMEOUT, { option: true }],
  measureStartup: [false, { option: true }],
  showStartupWhatsNew: [false, { option: true }],
  openFromCLI: true,
  filePaths: async ({ data }, use, info) => {
    if (!data) {
      return use(null);
    }

    const filename = data.inputData.metadata.projectId;

    await use({
      opossum: info.outputPath(`${filename}.opossum`),
      json: info.outputPath(`${filename}.json`),
    });
  },
  window: async (
    {
      appLoadTimeout,
      data,
      openFromCLI,
      existingFilePath,
      filePaths,
      playwrightTracing,
      releasePathOverride,
      measureStartup,
      showStartupWhatsNew,
    },
    use,
    info,
  ) => {
    if (existingFilePath) {
      try {
        await fs.promises.access(existingFilePath);
      } catch {
        throw new Error(`Missing existing test file: ${existingFilePath}`);
      }
    }

    const opossumFilePath =
      existingFilePath ??
      (data && filePaths && (await createTestFiles({ data, filePaths })));

    const artifactBaseName = getArtifactBaseName(data);

    const userDataPath = info.outputPath('user-data');
    await fs.promises.mkdir(userDataPath, { recursive: true });
    await fs.promises.writeFile(
      path.join(userDataPath, 'settings.json'),
      JSON.stringify({
        lastSeenWhatsNewRevision: showStartupWhatsNew
          ? 0
          : Number.MAX_SAFE_INTEGER,
      }),
    );
    const startupStartedAt = performance.now();
    let currentSession = await startAppSession({
      appLoadTimeout,
      args: [`--user-data-dir=${userDataPath}`].concat(
        opossumFilePath && openFromCLI ? [opossumFilePath] : [],
      ),
      playwrightTracing,
      releasePathOverride,
    });
    if (opossumFilePath && openFromCLI) {
      await currentSession.window.getByTestId('resources-tree').waitFor({
        state: 'visible',
        timeout: appLoadTimeout,
      });
    }

    // Starting and closing app sessions works identically for the initially
    // launched session and for sessions created by relaunching, so both flows
    // behave the same. The session labels describe the session in relation to
    // relaunches and are used prefixed in error messages; without any
    // relaunch the label is empty.
    const finishedSessions: Array<{
      label: string;
      unexpectedDialogCalls: Array<string>;
    }> = [];

    const finishCurrentAppSession = async (
      artifactSuffix: string,
    ): Promise<Array<string>> => {
      const { app, window, mainProcessLogs, tracingActive } = currentSession;

      // The dialog stub state must be read before the app is closed.
      const unexpectedDialogCalls = await getUnexpectedSyncDialogCalls(app);

      if (mainProcessLogs.length > 0) {
        fs.writeFileSync(
          info.outputPath(
            `${artifactBaseName}${artifactSuffix}.main-process.log`,
          ),
          mainProcessLogs.join(''),
        );
      }

      // The trace must be ended before the app and its browser context are
      // closed.
      if (tracingActive) {
        currentSession.tracingActive = false;
        await window.context().tracing.stop({
          path: info.outputPath(
            `${artifactBaseName}${artifactSuffix}.trace.zip`,
          ),
        });
      }

      try {
        await app.close();
      } catch {
        // The app has already been closed.
      }

      return unexpectedDialogCalls;
    };

    await use(
      Object.assign(currentSession.window, {
        app: currentSession.app,
        startupDurationMs: measureStartup
          ? performance.now() - startupStartedAt
          : null,
        relaunch: async (): Promise<AppWindow> => {
          finishedSessions.push({
            label: 'Before relaunch',
            unexpectedDialogCalls: await finishCurrentAppSession(
              BEFORE_RELAUNCH_ARTIFACT_SUFFIX,
            ),
          });
          currentSession = await startAppSession({
            appLoadTimeout,
            // Reuse persisted settings without resetting or opening a file.
            args: [`--user-data-dir=${userDataPath}`],
            playwrightTracing,
            releasePathOverride,
          });
          return Object.assign(currentSession.window, {
            app: currentSession.app,
          });
        },
      }),
    );

    finishedSessions.push({
      label: finishedSessions.length > 0 ? 'After relaunch' : '',
      unexpectedDialogCalls: await finishCurrentAppSession(
        finishedSessions.length > 0 ? AFTER_RELAUNCH_ARTIFACT_SUFFIX : '',
      ),
    });

    const violatingSessions = finishedSessions.filter(
      ({ unexpectedDialogCalls }) => unexpectedDialogCalls.length > 0,
    );
    if (violatingSessions.length > 0) {
      throw new Error(
        violatingSessions
          .map(
            ({ label, unexpectedDialogCalls }) =>
              `${label ? `${label} - ` : ''}Unexpected unstubbed native dialog call${unexpectedDialogCalls.length === 1 ? '' : 's'}: ${unexpectedDialogCalls.join(', ')}`,
          )
          .join('\n'),
      );
    }
  },
  relaunch: async ({ window }, use) => {
    await use(async () => {
      const restartedWindow = await window.relaunch();
      return {
        window: restartedWindow,
        ...createPageObjects(restartedWindow),
      };
    });
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
});

function getArtifactBaseName(data: OpossumData | undefined): string {
  return data?.inputData.metadata.projectId || 'app';
}

function getPlatformArgs(): Array<string> {
  const platformArgs = [];
  if (os.platform() === 'linux') {
    platformArgs.push('--no-sandbox');
  }
  if (process.env.E2E_XVFB) {
    // The purpose of this is to allow running the tests in the background. Wayland requires a configured headless compositor for this, so force X11.
    platformArgs.push('--ozone-platform=x11');
  }
  return platformArgs;
}

async function launchOpossumApp({
  appLoadTimeout,
  args,
  releasePathOverride,
}: {
  appLoadTimeout: number;
  args: Array<string>;
  releasePathOverride: string | null;
}): Promise<{
  app: ElectronApplication;
  window: Page;
  mainProcessLogs: Array<string>;
}> {
  const [executablePath, main] = getLaunchProps(releasePathOverride);
  const app = await electron.launch({
    args: [...(main ? [main] : []), ...args, ...getPlatformArgs()],
    executablePath,
    env: {
      ...process.env,
      RESET: '',
      OPOSSUM_DISABLE_AUTOMATIC_UPDATE_CHECKS: '1',
    },
  });
  await installDefaultSyncDialogStubs(app);

  // Capture main process stdout/stderr for debugging
  const mainProcessLogs: Array<string> = [];
  app.process().stdout?.on('data', (data: Buffer) => {
    mainProcessLogs.push(`[stdout] ${data.toString()}`);
  });
  app.process().stderr?.on('data', (data: Buffer) => {
    mainProcessLogs.push(`[stderr] ${data.toString()}`);
  });

  const window = await app.firstWindow();
  await window.setViewportSize({
    width: 1920,
    height: 1080,
  });
  await window.waitForLoadState('domcontentloaded', {
    timeout: appLoadTimeout,
  });
  await window
    .getByRole('button', { name: 'open file', includeHidden: true })
    .waitFor({ state: 'visible', timeout: appLoadTimeout });

  return { app, window, mainProcessLogs };
}

async function startAppSession({
  appLoadTimeout,
  args,
  playwrightTracing,
  releasePathOverride,
}: {
  appLoadTimeout: number;
  args: Array<string>;
  playwrightTracing: boolean;
  releasePathOverride: string | null;
}): Promise<AppSession> {
  const { app, window, mainProcessLogs } = await launchOpossumApp({
    appLoadTimeout,
    args,
    releasePathOverride,
  });

  let tracingActive = false;
  if (playwrightTracing) {
    await window
      .context()
      .tracing.start({ screenshots: true, snapshots: true });
    tracingActive = true;
  }

  return { app, window, mainProcessLogs, tracingActive };
}

function getLaunchProps(
  releasePathOverride: string | null,
): [executablePath: string | undefined, main: string | undefined] {
  if (process.env.CI || process.env.RELEASE) {
    const releasePath = getReleasePath(releasePathOverride);
    if (releasePath.toLowerCase().endsWith('.appimage')) {
      return [releasePath, undefined];
    }

    const appInfo = parseElectronApp(releasePath);
    return [appInfo.executable, appInfo.main];
  }

  return [undefined, 'build/ElectronBackend/app.js'];
}

function getReleasePath(releasePathOverride: string | null): string {
  if (releasePathOverride) {
    return path.resolve(releasePathOverride);
  }

  if (os.platform() === 'win32') {
    return path.join(
      __dirname,
      '..',
      '..',
      '..',
      'release',
      'win',
      'win-unpacked',
    );
  } else if (os.platform() === 'darwin') {
    if (os.arch() === 'arm64') {
      return path.join(__dirname, '..', '..', '..', 'release', 'mac-arm64');
    }
    return path.join(__dirname, '..', '..', '..', 'release', 'mac');
  } else if (os.platform() === 'linux') {
    return path.join(
      __dirname,
      '..',
      '..',
      '..',
      'release',
      'linux',
      'linux-unpacked',
    );
  }

  throw new Error('Unsupported platform');
}

async function createTestFiles({
  data: { inputData, outputData, readonlyRules },
  filePaths: { json, opossum },
}: {
  data: OpossumData;
  filePaths: FilePaths;
}): Promise<string> {
  await fs.promises.writeFile(json, JSON.stringify(inputData));
  await writeOpossumFile({
    input: inputData,
    path: opossum,
    output: outputData,
    readonlyRules,
  });

  return opossum;
}
