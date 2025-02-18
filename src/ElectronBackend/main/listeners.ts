// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, shell, WebContents } from 'electron';
import fs from 'fs';
import path from 'path';
import upath from 'upath';

import { legacyOutputFileEnding } from '../../Frontend/shared-constants';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
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
  SaveFileArgs,
} from '../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { LoadedFileFormat } from '../enums/enums';
import {
  createListenerCallbackWithErrorHandling,
  createVoidListenerCallbackWithErrorHandling,
  ListenerErrorReporting,
} from '../errorHandling/errorHandling';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import { serializeAttributions } from '../input/parseInputData';
import { convertToOpossum } from '../opossum-file/opossum-file';
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

export function getSaveFileListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: SaveFileArgs) => Promise<void> {
  return createVoidListenerCallbackWithErrorHandling(
    mainWindow,
    (_: unknown, args: SaveFileArgs) => {
      const globalBackendState = getGlobalBackendState();

      if (!globalBackendState.projectId) {
        throw new Error('Project ID not found');
      }

      const outputFileContent: OpossumOutputFile = {
        metadata: {
          projectId: globalBackendState.projectId,
          fileCreationDate: String(Date.now()),
          inputFileMD5Checksum: globalBackendState.inputFileChecksum,
        },
        manualAttributions: serializeAttributions(args.manualAttributions),
        resourcesToAttributions: args.resourcesToAttributions,
        resolvedExternalAttributions: Array.from(
          args.resolvedExternalAttributions,
        ),
      };

      return writeOutputJsonToFile(outputFileContent);
    },
  );
}

async function writeOutputJsonToFile(
  outputFileContent: OpossumOutputFile,
): Promise<void> {
  const globalBackendState = getGlobalBackendState();
  const fileLoadedType = getLoadedFileType(globalBackendState);
  if (fileLoadedType === LoadedFileFormat.Opossum) {
    await writeOpossumFile({
      path: globalBackendState.opossumFilePath as string,
      input: getGlobalBackendState().inputFileRaw,
      output: outputFileContent,
    });
  } else {
    await writeFile({
      path: globalBackendState.attributionFilePath as string,
      content: outputFileContent,
    });
  }
}

export function getOpenFileListener(
  mainWindow: BrowserWindow,
  onOpen: () => void,
): () => Promise<void> {
  return createVoidListenerCallbackWithErrorHandling(mainWindow, async () => {
    const filePaths = openOpossumFileDialog();
    if (!filePaths || filePaths.length < 1) {
      return;
    }
    const filePath = filePaths[0];

    await handleOpeningFile(mainWindow, filePath, onOpen);
  });
}

export async function handleOpeningFile(
  mainWindow: BrowserWindow,
  filePath: string,
  onOpen: () => void,
): Promise<void> {
  logger.info('Initializing global backend state');
  initializeGlobalBackendState(filePath, true);

  await openFile(mainWindow, filePath, onOpen);
}

export function getImportFileListener(
  mainWindow: BrowserWindow,
  fileFormat: FileFormatInfo,
): () => Promise<void> {
  return createVoidListenerCallbackWithErrorHandling(mainWindow, () => {
    mainWindow.webContents.send(
      AllowedFrontendChannels.ImportFileShowDialog,
      fileFormat,
    );
  });
}

export function getImportFileSelectInputListener(
  mainWindow: BrowserWindow,
): (
  _: Electron.IpcMainInvokeEvent,
  fileFormat: FileFormatInfo,
) => Promise<string> {
  return createListenerCallbackWithErrorHandling(
    mainWindow,
    '',
    (_: Electron.IpcMainInvokeEvent, fileFormat: FileFormatInfo) => {
      const filePaths = openNonOpossumFileDialog(fileFormat);

      // NOTE: explicitly checking filePaths.length creates issues in e2e tests
      // because the mocked return value of the dialog is not an array but rather
      // and object with number indices for some reason, so filePaths.length is
      // undefined in e2e tests
      return filePaths?.[0] || '';
    },
  );
}

export function getImportFileSelectSaveLocationListener(
  mainWindow: BrowserWindow,
): (_: Electron.IpcMainInvokeEvent, defaultPath: string) => Promise<string> {
  return createListenerCallbackWithErrorHandling(
    mainWindow,
    '',
    (_: Electron.IpcMainInvokeEvent, defaultPath: string) => {
      const filePath = saveFileDialog(defaultPath);
      return filePath ?? '';
    },
  );
}

export function getImportFileConvertAndLoadListener(
  mainWindow: BrowserWindow,
  onOpen: () => void,
): (
  _: Electron.IpcMainInvokeEvent,
  resourceFilePath: string,
  fileType: FileType,
  opossumFilePath: string,
) => Promise<boolean> {
  return createListenerCallbackWithErrorHandling(
    mainWindow,
    false,
    async (
      _: Electron.IpcMainInvokeEvent,
      resourceFilePath: string,
      fileType: FileType,
      opossumFilePath: string,
    ) => {
      if (!resourceFilePath.trim() || !fs.existsSync(resourceFilePath)) {
        throw new Error('Input file does not exist');
      }

      if (!opossumFilePath.trim()) {
        throw new Error('No .opossum save location selected');
      }

      if (!opossumFilePath.endsWith('.opossum')) {
        throw new Error('Output file name must have .opossum extension');
      }

      if (!fs.existsSync(path.dirname(opossumFilePath))) {
        throw new Error('Output directory does not exist');
      }

      logger.info('Converting input file to .opossum format');
      await convertToOpossum(resourceFilePath, opossumFilePath, fileType);

      logger.info('Updating global backend state');
      initializeGlobalBackendState(opossumFilePath, true);

      await openFile(mainWindow, opossumFilePath, onOpen, true);

      return true;
    },
    ListenerErrorReporting.SendToFrontend,
  );
}

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

export function getDeleteAndCreateNewAttributionFileListener(
  mainWindow: BrowserWindow,
  onOpen: () => void,
): () => Promise<void> {
  return createVoidListenerCallbackWithErrorHandling(mainWindow, async () => {
    const globalBackendState = getGlobalBackendState();
    const resourceFilePath = globalBackendState.resourceFilePath as string;

    logger.info(
      `Deleting attribution file and opening input file ${resourceFilePath}`,
    );
    if (globalBackendState.attributionFilePath) {
      fs.unlinkSync(globalBackendState.attributionFilePath);
    } else {
      throw new Error(
        `Failed to delete output file. Attribution file path is incorrect: ${globalBackendState.attributionFilePath}`,
      );
    }
    await openFile(mainWindow, resourceFilePath, onOpen);
  });
}

export function getSelectBaseURLListener(
  mainWindow: BrowserWindow,
): () => void {
  return createVoidListenerCallbackWithErrorHandling(mainWindow, () => {
    const baseURLs = selectBaseURLDialog();
    if (!baseURLs || baseURLs.length < 1) {
      return;
    }
    const baseURL = baseURLs[0];
    const formattedBaseURL = formatBaseURL(baseURL);

    mainWindow.webContents.send(AllowedFrontendChannels.SetBaseURLForRoot, {
      baseURLForRoot: formattedBaseURL,
    });
  });
}

function formatBaseURL(baseURL: string): string {
  return `file://${baseURL}/{path}`;
}

export async function openFile(
  mainWindow: BrowserWindow,
  filePath: string,
  onOpen: () => void,
  isImport?: boolean,
): Promise<void> {
  if (!isImport) {
    setLoadingState(mainWindow.webContents, true);
  }

  try {
    await loadInputAndOutputFromFilePath(mainWindow, filePath);
    setTitle(mainWindow, filePath);
    onOpen();
  } finally {
    if (!isImport) {
      setLoadingState(mainWindow.webContents, false);
    }
  }
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

export function getOpenLinkListener(): (
  _: unknown,
  args: OpenLinkArgs,
) => Promise<Error | void> {
  return async (_, args: OpenLinkArgs): Promise<Error | void> => {
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
  };
}

interface FileExporterAndExportedFilePath<T> {
  exportedFilePath: string | undefined;
  fileExporter: (filePath: string, args: T) => Promise<void> | void;
}

export function getExportedFilePathAndFileExporter(
  exportType: ExportType,
): FileExporterAndExportedFilePath<
  | ExportFollowUpArgs
  | ExportCompactBomArgs
  | ExportDetailedBomArgs
  | ExportSpdxDocumentYamlArgs
  | ExportSpdxDocumentJsonArgs
>;
export function getExportedFilePathAndFileExporter(
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

export function exportFile(mainWindow: BrowserWindow) {
  return async (_: unknown, exportArgs: ExportArgsType): Promise<void> => {
    const { exportedFilePath, fileExporter } =
      getExportedFilePathAndFileExporter(exportArgs.type);

    try {
      if (exportedFilePath) {
        logger.info(`Writing to ${exportedFilePath}`);
        await fileExporter(exportedFilePath, exportArgs);
      } else {
        logger.error('Failed to create export');
        throw new Error('Failed to create export');
      }
    } finally {
      setLoadingState(mainWindow.webContents, false);

      if (exportedFilePath) {
        shell.showItemInFolder(exportedFilePath);
      }
    }
  };
}

export function getExportFileListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: ExportArgsType) => Promise<void> {
  return createVoidListenerCallbackWithErrorHandling(
    mainWindow,
    exportFile(mainWindow),
  );
}

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

export function setLoadingState(
  webContents: WebContents,
  isLoading: boolean,
): void {
  webContents.send(AllowedFrontendChannels.FileLoading, {
    isLoading,
  });
}
