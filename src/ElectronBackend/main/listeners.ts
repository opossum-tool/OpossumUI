// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, shell } from 'electron';
import fs from 'fs';
import { uniq } from 'lodash-es';
import path from 'path';
import upath from 'upath';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  ExportType,
  type FileFilter,
  type FileFormatInfo,
  type FileType,
  MergeOpossumFilesErrorType,
  type MergeOpossumFilesResult,
  type OpenLinkArgs,
  OPOSSUM_FILE_FORMAT,
  type SelectSaveFileOptions,
  type SplitFileResult,
} from '../../shared/shared-types';
import { text } from '../../shared/text';
import { getMainDbClient } from '../dbProcess/dbProcessClient';
import {
  sendListenerErrorToFrontend,
  showListenerErrorInMessageBox,
} from '../errorHandling/errorHandling';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import {
  convertToOpossum,
  mergeFileIntoOpossum,
} from '../opossum-file/opossum-file';
import type { GlobalBackendState } from '../types/types';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { isFileLoaded } from '../utils/getLoadedFile';
import {
  openOpossumFileDialog,
  selectBaseURLDialog,
  selectFile,
  selectFiles,
  selectSaveFile,
} from './dialogs';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from './globalBackendState';
import logger from './logger';
import { ProcessingStatusUpdater } from './ProcessingStatusUpdater';
import { UserSettingsService } from './user-settings-service';

const MAX_NUMBER_OF_RECENTLY_OPENED_PATHS = 10;

export const saveFileListener =
  (mainWindow: BrowserWindow) =>
  async (_: unknown): Promise<void> => {
    try {
      const globalBackendState = getGlobalBackendState();
      if (!globalBackendState.projectId) {
        throw new Error('Project ID not found');
      }
      if (!globalBackendState.opossumFilePath) {
        throw new Error('No .opossum project is currently open.');
      }

      await getMainDbClient().saveFile({
        projectId: globalBackendState.projectId,
        opossumFilePath: globalBackendState.opossumFilePath,
      });
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    }
  };

export const forceUnlockCurrentOpossumFileListener =
  (mainWindow: BrowserWindow, updateMenu: () => Promise<void>) =>
  async (): Promise<void> => {
    try {
      const globalBackendState = getGlobalBackendState();
      if (
        !globalBackendState.projectId ||
        !globalBackendState.opossumFilePath
      ) {
        throw new Error('No .opossum project is currently open.');
      }

      await getMainDbClient().forceUnlock({
        projectId: globalBackendState.projectId,
        opossumFilePath: globalBackendState.opossumFilePath,
      });
      await updateMenu();
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    }
  };

export const splitCurrentOpossumFileListener =
  (_mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    selectedFolderPaths: Array<string>,
    splitOpossumFilePath: string,
  ): Promise<SplitFileResult> => {
    try {
      const globalBackendState = getGlobalBackendState();
      if (
        !globalBackendState.projectId ||
        !globalBackendState.opossumFilePath
      ) {
        throw new Error('No .opossum project is currently open.');
      }

      if (!splitOpossumFilePath) {
        return { status: 'cancelled' };
      }
      await getMainDbClient().splitOpossumFile({
        saveFileParams: {
          projectId: globalBackendState.projectId,
          opossumFilePath: globalBackendState.opossumFilePath,
        },
        selectedFolderPaths,
        splitOpossumFilePath,
      });
      return { status: 'success' };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unexpected internal error while creating the split archive';
      logger.error(`Could not create split archive: ${message}`);
      return { status: 'error', message };
    }
  };

export const mergeCurrentOpossumFilesListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    partitionPaths: Array<string>,
    ignoreReadonlyResourceOutputConflicts: boolean,
  ): Promise<MergeOpossumFilesResult> => {
    const processingStatusUpdater = new ProcessingStatusUpdater(
      mainWindow.webContents,
    );
    processingStatusUpdater.startProcessing();
    const globalBackendState = getGlobalBackendState();
    try {
      if (
        !globalBackendState.projectId ||
        !globalBackendState.opossumFilePath
      ) {
        const errorMessage = 'No .opossum project is currently open.';
        processingStatusUpdater.error(errorMessage);
        return {
          errorMessage,
          errorType: MergeOpossumFilesErrorType.Unknown,
          status: 'error',
        };
      }

      const result = await getMainDbClient().mergeOpossumFiles(
        {
          ignoreReadonlyResourceOutputConflicts,
          saveFileParams: {
            projectId: globalBackendState.projectId,
            opossumFilePath: globalBackendState.opossumFilePath,
          },
          partitionPaths,
        },
        (message, level) => {
          if (level === 'warn') {
            processingStatusUpdater.warn(message);
          } else {
            processingStatusUpdater.info(message);
          }
        },
      );
      reportMergeResult(processingStatusUpdater, result);
      return result;
    } finally {
      processingStatusUpdater.endProcessing();
    }
  };

export async function mergeOpossumFilesFromPathsListener(
  mainWindow: BrowserWindow,
  _: Electron.IpcMainInvokeEvent,
  inputPaths: Array<string>,
  outputPath: string,
  ignoreReadonlyResourceOutputConflicts: boolean,
): Promise<MergeOpossumFilesResult> {
  const processingStatusUpdater = new ProcessingStatusUpdater(
    mainWindow.webContents,
  );
  processingStatusUpdater.startProcessing();
  try {
    const result = await getMainDbClient().mergeOpossumFilesFromPaths(
      {
        ignoreReadonlyResourceOutputConflicts,
        inputPaths,
        outputPath,
      },
      (message) => processingStatusUpdater.info(message),
    );
    reportMergeResult(processingStatusUpdater, result);
    return result;
  } finally {
    processingStatusUpdater.endProcessing();
  }
}

function reportMergeResult(
  processingStatusUpdater: ProcessingStatusUpdater,
  result: MergeOpossumFilesResult,
): void {
  if (result.status !== 'error') {
    return;
  }
  if (
    result.errorType ===
    MergeOpossumFilesErrorType.ReadonlyResourceOutputConflict
  ) {
    processingStatusUpdater.warn('Readonly resource output conflicts detected');
  } else {
    processingStatusUpdater.error(
      result.errorMessage ?? 'Unexpected internal error while merging',
    );
  }
}

export const selectSplitDestinationListener =
  (_mainWindow: BrowserWindow) =>
  (
    _: Electron.IpcMainInvokeEvent,
    selectedFolderPaths: Array<string>,
  ): string => {
    const opossumFilePath = getGlobalBackendState().opossumFilePath;
    if (!opossumFilePath) {
      return '';
    }

    const parsedPath = path.parse(opossumFilePath);
    const partitionSuffix =
      selectedFolderPaths.length === 1
        ? path.posix.basename(selectedFolderPaths[0])
        : 'partition';
    const partitionPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-${partitionSuffix}${parsedPath.ext}`,
    );
    return (
      selectSaveFile({
        defaultPath: partitionPath,
        filter: OPOSSUM_FILE_FORMAT,
      }) ?? ''
    );
  };

function getExportFilePath(exportType: ExportType): string {
  const globalState = getGlobalBackendState();
  const pathMap: Record<ExportType, string | undefined> = {
    [ExportType.FollowUp]: globalState.followUpFilePath,
    [ExportType.CompactBom]: globalState.compactBomFilePath,
    [ExportType.DetailedBom]: globalState.detailedBomFilePath,
    [ExportType.SpdxDocumentYaml]: globalState.spdxYamlFilePath,
    [ExportType.SpdxDocumentJson]: globalState.spdxJsonFilePath,
  };
  const filePath = pathMap[exportType];
  if (!filePath) {
    throw new Error(`Export file path for ${exportType} is not set`);
  }
  return filePath;
}

export const exportFileListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    exportType: ExportType,
  ): Promise<void> => {
    try {
      const filePath = getExportFilePath(exportType);
      await getMainDbClient().exportFile(exportType, filePath);
      shell.showItemInFolder(filePath);
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    }
  };

export const openFileListener =
  (mainWindow: BrowserWindow, updateMenu: () => Promise<void>) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    requestedFilePath?: string,
  ): Promise<void> => {
    try {
      const filePath = requestedFilePath ?? openOpossumFileDialog()?.[0];
      if (!filePath) {
        return;
      }

      await handleOpeningFile(mainWindow, filePath, updateMenu);
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    }
  };

export async function handleOpeningFile(
  mainWindow: BrowserWindow,
  filePath: string,
  updateMenu: () => Promise<void>,
): Promise<void> {
  const statusUpdater = new ProcessingStatusUpdater(mainWindow.webContents);
  statusUpdater.startProcessing();
  statusUpdater.info('Initializing global backend state');
  initializeGlobalBackendState(filePath);

  await openFile(mainWindow, filePath, updateMenu);

  await updateRecentlyOpenedPaths(filePath);

  await updateMenu();

  statusUpdater.endProcessing();
}

export const importFileListener =
  (mainWindow: BrowserWindow, fileFormat: FileFormatInfo) => (): void => {
    mainWindow.webContents.send(
      AllowedFrontendChannels.ShowImportDialog,
      fileFormat,
      isFileLoaded(getGlobalBackendState()),
    );
  };

export const selectFileListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    fileFilter: FileFilter,
  ): Promise<string> => {
    try {
      const filePaths = selectFile(fileFilter);

      // NOTE: explicitly checking filePaths.length creates issues in e2e tests
      // because the mocked return value of the dialog is not an array but rather
      // and object with number indices for some reason, so filePaths.length is
      // undefined in e2e tests
      return filePaths?.[0] ?? '';
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
      return '';
    }
  };

export const selectFilesListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    fileFilter: FileFilter,
  ): Promise<Array<string>> => {
    try {
      return selectFiles(fileFilter) ?? [];
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
      return [];
    }
  };

export const selectSaveFileListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    options: SelectSaveFileOptions,
  ): Promise<string> => {
    try {
      return selectSaveFile(options) ?? '';
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
      return '';
    }
  };

export const importFileConvertAndLoadListener =
  (mainWindow: BrowserWindow, updateMenu: () => Promise<void>) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    resourceFilePath: string,
    fileType: FileType,
    opossumFilePath: string,
  ): Promise<boolean> => {
    const processingStatusUpdater = new ProcessingStatusUpdater(
      mainWindow.webContents,
    );
    processingStatusUpdater.startProcessing();

    try {
      if (!resourceFilePath.trim() || !fs.existsSync(resourceFilePath)) {
        throw new Error(text.backendError.inputFileDoesNotExist);
      }

      try {
        fs.accessSync(resourceFilePath, fs.constants.R_OK);
      } catch (error) {
        throw new Error(text.backendError.inputFilePermissionError, {
          cause: error,
        });
      }

      if (!opossumFilePath.trim()) {
        throw new Error(text.backendError.opossumFileNotSelected);
      }

      if (!opossumFilePath.endsWith('.opossum')) {
        throw new Error(text.backendError.opossumFileWrongExtension);
      }

      if (!fs.existsSync(path.dirname(opossumFilePath))) {
        throw new Error(text.backendError.opossumFileDirectoryDoesNotExist);
      }

      try {
        fs.accessSync(path.dirname(opossumFilePath), fs.constants.W_OK);
      } catch (error) {
        throw new Error(text.backendError.opossumFilePermissionError, {
          cause: error,
        });
      }

      processingStatusUpdater.info('Converting input file to .opossum format');
      await convertToOpossum(resourceFilePath, opossumFilePath, fileType);

      processingStatusUpdater.info('Updating global backend state');
      initializeGlobalBackendState(opossumFilePath);

      await openFile(mainWindow, opossumFilePath, updateMenu);

      return true;
    } catch (error) {
      sendListenerErrorToFrontend(processingStatusUpdater, error);
      return false;
    } finally {
      processingStatusUpdater.endProcessing();
    }
  };

export const mergeFileAndLoadListener =
  (mainWindow: BrowserWindow, updateMenu: () => Promise<void>) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    inputFilePath: string,
    fileType: FileType,
  ): Promise<boolean> => {
    const processingStatusUpdater = new ProcessingStatusUpdater(
      mainWindow.webContents,
    );
    processingStatusUpdater.startProcessing();

    try {
      if (!inputFilePath.trim() || !fs.existsSync(inputFilePath)) {
        throw new Error(text.backendError.inputFileDoesNotExist);
      }

      try {
        fs.accessSync(inputFilePath, fs.constants.R_OK);
      } catch (error) {
        throw new Error(text.backendError.inputFilePermissionError, {
          cause: error,
        });
      }

      const currentOpossumFilePath = getGlobalBackendState().opossumFilePath;

      if (!currentOpossumFilePath) {
        throw new Error(text.backendError.noOpenFileToMergeInto);
      }

      try {
        fs.copyFileSync(
          currentOpossumFilePath,
          `${currentOpossumFilePath}.backup`,
        );
      } catch (error) {
        throw new Error(text.backendError.cantCreateBackup, { cause: error });
      }

      processingStatusUpdater.info(
        'Merging input file into current .opossum file',
      );
      await mergeFileIntoOpossum(
        inputFilePath,
        currentOpossumFilePath,
        fileType,
      );

      await openFile(mainWindow, currentOpossumFilePath, updateMenu);

      return true;
    } catch (error) {
      sendListenerErrorToFrontend(processingStatusUpdater, error);
      return false;
    } finally {
      processingStatusUpdater.endProcessing();
    }
  };

function initializeGlobalBackendState(filePath: string): void {
  const newGlobalBackendState: GlobalBackendState = {
    opossumFilePath: filePath,
    followUpFilePath: getFilePathWithAppendix(filePath, '_follow_up.csv'),
    compactBomFilePath: getFilePathWithAppendix(
      filePath,
      '_compact_component_list.csv',
    ),
    detailedBomFilePath: getFilePathWithAppendix(
      filePath,
      '_detailed_component_list.csv',
    ),
    spdxYamlFilePath: getFilePathWithAppendix(filePath, '.spdx.yaml'),
    spdxJsonFilePath: getFilePathWithAppendix(filePath, '.spdx.json'),
  };
  setGlobalBackendState(newGlobalBackendState);
}

export const selectBaseURLListener =
  (mainWindow: BrowserWindow) => async (): Promise<void> => {
    try {
      if (!getGlobalBackendState().projectId) {
        throw new Error('No file currently open');
      }
      const baseURLs = selectBaseURLDialog();
      if (!baseURLs || baseURLs.length < 1) {
        return;
      }
      const baseURL = baseURLs[0];
      mainWindow.webContents.send(
        AllowedFrontendChannels.SetBaseURLForRoot,
        formatBaseURL(baseURL),
      );
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    }
  };

function formatBaseURL(baseURL: string): string {
  return `file://${baseURL}/{path}`;
}

async function openFile(
  mainWindow: BrowserWindow,
  filePath: string,
  updateMenu: () => Promise<void>,
): Promise<void> {
  await loadInputAndOutputFromFilePath(mainWindow, filePath);
  setTitle(mainWindow, filePath);
  await updateMenu();
}

async function updateRecentlyOpenedPaths(filePath: string): Promise<void> {
  const recentlyOpenedPaths = await UserSettingsService.get(
    'recentlyOpenedPaths',
  );
  await UserSettingsService.update(
    {
      recentlyOpenedPaths: uniq([
        filePath,
        ...(recentlyOpenedPaths ?? []),
      ]).slice(0, MAX_NUMBER_OF_RECENTLY_OPENED_PATHS),
    },
    { skipNotification: true },
  );
}

function setTitle(mainWindow: BrowserWindow, filePath: string): void {
  const defaultTitle = 'OpossumUI';

  mainWindow.setTitle(
    getGlobalBackendState().projectTitle ||
      decodeURIComponent(
        upath.toUnix(filePath).split('/').pop() || defaultTitle,
      ),
  );
}

export function linkHasHttpSchema(link: string): boolean {
  const url = new URL(link);
  return url.protocol === 'https:' || url.protocol === 'http:';
}

export async function openLinkListener(
  _: unknown,
  args: OpenLinkArgs,
): Promise<Error | void> {
  try {
    if (!linkHasHttpSchema(args.link)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(`Invalid URL ${args.link}`);
    }
    // Does not throw on Linux if link cannot be opened.
    // see https://github.com/electron/electron/issues/28183
    return await shell.openExternal(args.link);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.info(`Cannot open link ${args.link}: ${error.message}`);
      return error;
    }
    logger.info(`Cannot open link ${args.link}`);
    return new Error('Cannot open link');
  }
}
