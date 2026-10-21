// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  test as base,
  _electron as electron,
  type ElectronApplication,
  type Page,
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

export const test = base.extend<{
  window: Page & {
    app: ElectronApplication;
    startupDurationMs: number | null;
    /** Closes the app and relaunches it with the same user data directory (no reset, no file). */
    relaunch: () => Promise<Page & { app: ElectronApplication }>;
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
  filePaths: FilePaths | null;
  fileSupportPopup: FileSupportPopup;
  forceUnlockPopup: ForceUnlockPopup;
  importDialog: ImportDialog;
  mergeOpossumFilesDialog: MergeOpossumFilesDialog;
  linkedResourcesTree: LinkedResourcesTree;
  menuBar: MenuBar;
  notSavedPopup: NotSavedPopup;
  openFromCLI: boolean;
  pathBar: PathBar;
  projectMetadataPopup: ProjectMetadataPopup;
  projectStatisticsPopup: ProjectStatisticsPopup;
  /** Closes the app and relaunches it */
  relaunch: () => Promise<Page & { app: ElectronApplication }>;
  reportView: ReportView;
  resourcesTree: ResourcesTree;
  signalsPanel: SignalsPanel;
  splitDialog: SplitDialog;
  topBar: TopBar;
}>({
  data: undefined,
  existingFilePath: [null, { option: true }],
  releasePathOverride: [null, { option: true }],
  playwrightTracing: [true, { option: true }],
  appLoadTimeout: [LOAD_TIMEOUT, { option: true }],
  measureStartup: [false, { option: true }],
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

    const startupStartedAt = performance.now();
    let currentSession = await startAppSession({
      appLoadTimeout,
      args: [
        '--reset',
        `--user-data-dir=${info.outputPath('user-data')}`,
      ].concat(opossumFilePath && openFromCLI ? [opossumFilePath] : []),
      env: { ...process.env, RESET: '1' },
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
        relaunch: async (): Promise<Page & { app: ElectronApplication }> => {
          finishedSessions.push({
            label: 'Before relaunch',
            unexpectedDialogCalls: await finishCurrentAppSession(
              BEFORE_RELAUNCH_ARTIFACT_SUFFIX,
            ),
          });
          currentSession = await startAppSession({
            appLoadTimeout,
            // The user data directory is reused so that persisted user
            // settings are still present. Contrary to the initial launch, no
            // reset flags are passed and no file is opened.
            args: [`--user-data-dir=${info.outputPath('user-data')}`],
            env: { ...process.env, RESET: '' },
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
    await use(window.relaunch);
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
  projectMetadataPopup: async ({ window }, use) => {
    await use(new ProjectMetadataPopup(window));
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
  forceUnlockPopup: async ({ window }, use) => {
    await use(new ForceUnlockPopup(window));
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
  splitDialog: async ({ window }, use) => {
    await use(new SplitDialog(window));
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
  importDialog: async ({ window }, use) => {
    await use(new ImportDialog(window));
  },
  mergeOpossumFilesDialog: async ({ window }, use) => {
    await use(new MergeOpossumFilesDialog(window));
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
  env,
  releasePathOverride,
}: {
  appLoadTimeout: number;
  args: Array<string>;
  env: { [key: string]: string };
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
    env,
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
    .getByRole('button', { name: 'open file' })
    .waitFor({ state: 'visible', timeout: appLoadTimeout });

  return { app, window, mainProcessLogs };
}

async function startAppSession({
  appLoadTimeout,
  args,
  env,
  playwrightTracing,
  releasePathOverride,
}: {
  appLoadTimeout: number;
  args: Array<string>;
  env: { [key: string]: string };
  playwrightTracing: boolean;
  releasePathOverride: string | null;
}): Promise<AppSession> {
  const { app, window, mainProcessLogs } = await launchOpossumApp({
    appLoadTimeout,
    args,
    env,
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
