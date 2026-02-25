// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, shell } from 'electron';
import fs from 'fs';
import { sql } from 'kysely';
import { uniq } from 'lodash';
import path from 'path';
import upath from 'upath';

import { legacyOutputFileEnding } from '../../Frontend/shared-constants';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  Attributions,
  ExportArgsType,
  ExportCompactBomArgs,
  ExportDetailedBomArgs,
  ExportFollowUpArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  FileFormatInfo,
  FileType,
  OpenLinkArgs,
  PackageInfo,
  ResourcesToAttributions,
  SaveFileArgs,
} from '../../shared/shared-types';
import { text } from '../../shared/text';
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { getDb } from '../db/db';
import { LoadedFileFormat } from '../enums/enums';
import {
  sendListenerErrorToFrontend,
  showListenerErrorInMessageBox,
} from '../errorHandling/errorHandling';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import { serializeAttributions } from '../input/parseInputData';
import {
  convertToOpossum,
  mergeFileIntoOpossum,
} from '../opossum-file/opossum-file';
import { writeCsvToFile } from '../output/writeCsvToFile';
import { writeSpdxFile } from '../output/writeSpdxFile';
import { GlobalBackendState, OpossumOutputFile } from '../types/types';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { getLoadedFileType } from '../utils/getLoadedFile';
import {
  openNonOpossumFileDialog,
  openOpossumFileDialog,
  saveFileDialog,
  selectBaseURLDialog,
} from './dialogs';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from './globalBackendState';
import logger from './logger';
import { ProcessingStatusUpdater } from './ProcessingStatusUpdater';
import { UserSettingsService } from './user-settings-service';

const MAX_NUMBER_OF_RECENTLY_OPENED_PATHS = 10;

export async function getSaveFileArgs(): Promise<{ result: SaveFileArgs }> {
  const getManualAttributions = await getDb()
    .selectFrom('attribution')
    .select(['uuid', 'data'])
    .where('is_external', '=', 0)
    .execute();
  const manualAttributions: Attributions = Object.fromEntries(
    getManualAttributions.map(({ uuid, data }) => [
      uuid,
      { ...(JSON.parse(data) as PackageInfo), id: uuid },
    ]),
  );

  const getResourceToManualAttributions = await getDb()
    .selectFrom('resource_to_attribution')
    .innerJoin('resource', 'resource.id', 'resource_to_attribution.resource_id')
    .select([
      'resource.path',
      sql<string>`GROUP_CONCAT(resource_to_attribution.attribution_uuid)`.as(
        'attribution_uuids',
      ),
    ])
    .where('resource_to_attribution.attribution_is_external', '=', 0)
    .groupBy('resource_to_attribution.resource_id')
    .execute();
  const resourcesToAttributions: ResourcesToAttributions = Object.fromEntries(
    getResourceToManualAttributions.map((val) => [
      val.path,
      val.attribution_uuids.split(','),
    ]),
  );

  const getResolvedExternalAttributions = await getDb()
    .selectFrom('attribution')
    .select(sql<string>`GROUP_CONCAT(uuid)`.as('attribution_uuids'))
    .where('is_resolved', '=', 1)
    .where('is_external', '=', 1)
    .executeTakeFirst();
  const resolvedExternalAttributions = new Set(
    getResolvedExternalAttributions?.attribution_uuids?.split(',') ?? [],
  );
  return {
    result: {
      manualAttributions,
      resourcesToAttributions,
      resolvedExternalAttributions,
    },
  };
}

export const saveFileListener =
  (mainWindow: BrowserWindow) =>
  async (_: unknown): Promise<void> => {
    try {
      const globalBackendState = getGlobalBackendState();
      if (!globalBackendState.projectId) {
        throw new Error('Project ID not found');
      }

      const saveFileArgs = await getSaveFileArgs();
      const outputFileContent: OpossumOutputFile = {
        metadata: {
          projectId: globalBackendState.projectId,
          fileCreationDate: String(Date.now()),
          inputFileMD5Checksum: globalBackendState.inputFileChecksum,
        },
        manualAttributions: serializeAttributions(
          saveFileArgs.result.manualAttributions,
        ),
        resourcesToAttributions: saveFileArgs.result.resourcesToAttributions,
        resolvedExternalAttributions: Array.from(
          saveFileArgs.result.resolvedExternalAttributions,
        ),
      };

      await writeOutputJsonToFile(outputFileContent);
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    }
  };

async function writeOutputJsonToFile(
  outputFileContent: OpossumOutputFile,
): Promise<void> {
  const globalBackendState = getGlobalBackendState();
  const fileLoadedType = getLoadedFileType(globalBackendState);
  if (fileLoadedType === LoadedFileFormat.Opossum) {
    await writeOpossumFile({
      path: globalBackendState.opossumFilePath as string,
      input: globalBackendState.inputFileRaw,
      output: outputFileContent,
    });
  } else {
    await writeFile({
      path: globalBackendState.attributionFilePath as string,
      content: outputFileContent,
    });
  }
}

export const openFileListener =
  (mainWindow: BrowserWindow, updateMenu: () => Promise<void>) =>
  async (): Promise<void> => {
    try {
      const filePaths = openOpossumFileDialog();
      if (!filePaths || filePaths.length < 1) {
        return;
      }
      const filePath = filePaths[0];

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
  initializeGlobalBackendState(filePath, true);

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
    );
  };

export const getMergeListener =
  (mainWindow: BrowserWindow, fileFormat: FileFormatInfo) => (): void => {
    mainWindow.webContents.send(
      AllowedFrontendChannels.ShowMergeDialog,
      fileFormat,
    );
  };

export const selectFileListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    fileFormat: FileFormatInfo,
  ): Promise<string> => {
    try {
      const filePaths = openNonOpossumFileDialog(fileFormat);

      // NOTE: explicitly checking filePaths.length creates issues in e2e tests
      // because the mocked return value of the dialog is not an array but rather
      // and object with number indices for some reason, so filePaths.length is
      // undefined in e2e tests
      return filePaths?.[0] || '';
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
      return '';
    }
  };

export const importFileSelectSaveLocationListener =
  (mainWindow: BrowserWindow) =>
  async (
    _: Electron.IpcMainInvokeEvent,
    defaultPath: string,
  ): Promise<string> => {
    try {
      return saveFileDialog(defaultPath) ?? '';
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
      initializeGlobalBackendState(opossumFilePath, true);

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

function initializeGlobalBackendState(
  filePath: string,
  isOpossumFormat: boolean,
  inputFileChecksum?: string,
): void {
  const newGlobalBackendState: GlobalBackendState = {
    resourceFilePath: isOpossumFormat ? undefined : filePath,
    attributionFilePath: isOpossumFormat
      ? undefined
      : getFilePathWithAppendix(filePath, legacyOutputFileEnding),
    opossumFilePath: isOpossumFormat ? filePath : undefined,
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
    inputFileChecksum,
  };
  setGlobalBackendState(newGlobalBackendState);
}

export const selectBaseURLListener =
  (mainWindow: BrowserWindow) => async (): Promise<void> => {
    try {
      const baseURLs = selectBaseURLDialog();
      if (!baseURLs || baseURLs.length < 1) {
        return;
      }
      const baseURL = baseURLs[0];
      const formattedBaseURL = formatBaseURL(baseURL);

      mainWindow.webContents.send(AllowedFrontendChannels.SetBaseURLForRoot, {
        baseURLForRoot: formattedBaseURL,
      });
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

interface FileExporterAndExportedFilePath<T> {
  exportedFilePath: string | undefined;
  fileExporter: (filePath: string, args: T) => Promise<void> | void;
}

function getExportedFilePathAndFileExporter(
  exportType: ExportType,
): FileExporterAndExportedFilePath<
  | ExportFollowUpArgs
  | ExportCompactBomArgs
  | ExportDetailedBomArgs
  | ExportSpdxDocumentYamlArgs
  | ExportSpdxDocumentJsonArgs
>;
function getExportedFilePathAndFileExporter(
  exportType: ExportType,
):
  | FileExporterAndExportedFilePath<ExportFollowUpArgs>
  | FileExporterAndExportedFilePath<ExportCompactBomArgs>
  | FileExporterAndExportedFilePath<ExportDetailedBomArgs>
  | FileExporterAndExportedFilePath<ExportSpdxDocumentYamlArgs>
  | FileExporterAndExportedFilePath<ExportSpdxDocumentJsonArgs> {
  const globalBackendState = getGlobalBackendState();

  switch (exportType) {
    case ExportType.FollowUp:
      return {
        exportedFilePath: globalBackendState.followUpFilePath,
        fileExporter: createFollowUp,
      };
    case ExportType.CompactBom:
      return {
        exportedFilePath: globalBackendState.compactBomFilePath,
        fileExporter: createCompactBom,
      };
    case ExportType.DetailedBom:
      return {
        exportedFilePath: globalBackendState.detailedBomFilePath,
        fileExporter: createDetailedBom,
      };
    case ExportType.SpdxDocumentYaml:
      return {
        exportedFilePath: globalBackendState.spdxYamlFilePath,
        fileExporter: writeSpdxFile,
      };
    case ExportType.SpdxDocumentJson:
      return {
        exportedFilePath: globalBackendState.spdxJsonFilePath,
        fileExporter: writeSpdxFile,
      };
  }
}

export const exportFileListener =
  (mainWindow: BrowserWindow) =>
  async (_: unknown, exportArgs: ExportArgsType): Promise<void> => {
    const { exportedFilePath, fileExporter } =
      getExportedFilePathAndFileExporter(exportArgs.type);

    const processingStatusUpdater = new ProcessingStatusUpdater(
      mainWindow.webContents,
    );
    try {
      if (exportedFilePath) {
        processingStatusUpdater.info(`Writing to ${exportedFilePath}`);
        await fileExporter(exportedFilePath, exportArgs);
      } else {
        processingStatusUpdater.error('Failed to create export');
        throw new Error('Failed to create export');
      }
    } catch (error) {
      await showListenerErrorInMessageBox(mainWindow, error);
    } finally {
      processingStatusUpdater.endProcessing();
      if (exportedFilePath) {
        shell.showItemInFolder(exportedFilePath);
      }
    }
  };

async function createFollowUp(
  followUpFilePath: string,
  args: ExportFollowUpArgs,
): Promise<void> {
  const followUpColumnOrder: Array<keyof PackageInfo> = [
    'packageName',
    'packageVersion',
    'url',
    'copyright',
    'licenseName',
    'resources',
  ];

  await writeCsvToFile(
    followUpFilePath,
    args.followUpAttributionsWithResources,
    followUpColumnOrder,
    true,
  );
}

async function createCompactBom(
  compactBomFilePath: string,
  args: ExportCompactBomArgs,
): Promise<void> {
  const miniBomColumnOrder: Array<keyof PackageInfo> = [
    'packageName',
    'packageVersion',
    'licenseName',
    'copyright',
    'url',
  ];

  await writeCsvToFile(
    compactBomFilePath,
    args.bomAttributions,
    miniBomColumnOrder,
  );
}

async function createDetailedBom(
  detailedBomFilePath: string,
  args: ExportDetailedBomArgs,
): Promise<void> {
  const detailedBomColumnOrder: Array<keyof PackageInfo> = [
    'packageName',
    'packageVersion',
    'packageNamespace',
    'packageType',
    'packagePURLAppendix',
    'url',
    'copyright',
    'licenseName',
    'licenseText',
    'resources',
  ];

  await writeCsvToFile(
    detailedBomFilePath,
    args.bomAttributionsWithResources,
    detailedBomColumnOrder,
  );
}
