// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, shell, WebContents } from 'electron';
import fs from 'fs';
import upath from 'upath';
import zlib from 'zlib';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  ExportArgsType,
  ExportCompactBomArgs,
  ExportDetailedBomArgs,
  ExportFollowUpArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  OpenLinkArgs,
  PackageInfo,
  SaveFileArgs,
  SendErrorInformationArgs,
} from '../../shared/shared-types';
import {
  OPOSSUM_FILE_EXTENSION,
  writeFile,
  writeOpossumFile,
} from '../../shared/write-file';
import { LoadedFileFormat } from '../enums/enums';
import {
  createListenerCallbackWithErrorHandling,
  getMessageBoxForErrors,
} from '../errorHandling/errorHandling';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import { serializeAttributions } from '../input/parseInputData';
import { writeCsvToFile } from '../output/writeCsvToFile';
import { writeSpdxFile } from '../output/writeSpdxFile';
import { GlobalBackendState, OpossumOutputFile } from '../types/types';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { getLoadedFileType } from '../utils/getLoadedFile';
import { isOpossumFileFormat } from '../utils/isOpossumFileFormat';
import { openFileDialog, selectBaseURLDialog } from './dialogs';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from './globalBackendState';
import logger from './logger';
import { activateMenuItems } from './menu';

const outputFileEnding = '_attributions.json';
const jsonGzipFileExtension = '.json.gz';
const jsonFileExtension = '.json';

export function getSaveFileListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: SaveFileArgs) => Promise<void> {
  return createListenerCallbackWithErrorHandling(
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
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const filePaths = openFileDialog();
    if (!filePaths || filePaths.length < 1) {
      return;
    }
    let filePath = filePaths[0];

    if (filePath.endsWith(outputFileEnding)) {
      filePath = tryToGetInputFileFromOutputFile(filePath);
    }

    await handleOpeningFile(mainWindow, filePath);
  });
}

export async function handleOpeningFile(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  const isOpossumFormat = isOpossumFileFormat(filePath);
  logger.info('Initializing global backend state');
  initializeGlobalBackendState(filePath, isOpossumFormat);

  if (!isOpossumFormat) {
    const dotOpossumFilePath = getDotOpossumFilePath(filePath);
    if (fs.existsSync(dotOpossumFilePath)) {
      initializeGlobalBackendState(dotOpossumFilePath, !isOpossumFormat);
    }
    mainWindow.webContents.send(AllowedFrontendChannels.ShowFileSupportPopup, {
      showFileSupportPopup: true,
      dotOpossumFileAlreadyExists: fs.existsSync(dotOpossumFilePath),
    });
    return;
  }

  await openFile(mainWindow, filePath);
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
      : getFilePathWithAppendix(filePath, outputFileEnding),
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

export function getKeepFileListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const filePath = getGlobalBackendState().resourceFilePath as string;
    await openFile(mainWindow, filePath);
  });
}

export function getDeleteAndCreateNewAttributionFileListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
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
    await openFile(mainWindow, resourceFilePath);
  });
}

export function getSelectBaseURLListener(
  mainWindow: BrowserWindow,
): () => void {
  return createListenerCallbackWithErrorHandling(mainWindow, () => {
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

function tryToGetInputFileFromOutputFile(filePath: string): string {
  const outputFilePattern = `(${outputFileEnding})$`;
  const outputFileRegex = new RegExp(outputFilePattern);

  return fs.existsSync(filePath.replace(outputFileRegex, jsonFileExtension))
    ? filePath.replace(outputFileRegex, jsonFileExtension)
    : fs.existsSync(filePath.replace(outputFileRegex, jsonGzipFileExtension))
      ? filePath.replace(outputFileRegex, jsonGzipFileExtension)
      : filePath;
}

export async function openFile(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  setLoadingState(mainWindow.webContents, true);

  try {
    await loadInputAndOutputFromFilePath(mainWindow, filePath);
    setTitle(mainWindow, filePath);
    activateMenuItems();
  } finally {
    setLoadingState(mainWindow.webContents, false);
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

export function getSendErrorInformationListener(
  mainWindow: BrowserWindow,
): (_: unknown, args: SendErrorInformationArgs) => Promise<void> {
  return async (_, args: SendErrorInformationArgs): Promise<void> => {
    logger.error(args.error.message + args.errorInfo.componentStack);
    await getMessageBoxForErrors(
      args.error.message,
      args.errorInfo.componentStack,
      mainWindow,
      false,
    );
  };
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
  return createListenerCallbackWithErrorHandling(
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

export function getConvertInputFileToDotOpossumAndOpenListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    logger.info('Converting .json to .opossum format');

    const isOpossumFormat = true;
    const globalBackendState = getGlobalBackendState();
    const resourceFilePath = globalBackendState.resourceFilePath;

    if (!resourceFilePath) {
      throw new Error(`Resource file path is invalid: ${resourceFilePath}`);
    }

    const dotOpossumFilePath = getDotOpossumFilePath(resourceFilePath);

    await writeOpossumFile({
      path: dotOpossumFilePath,
      input: getInputJson(resourceFilePath),
      output: getOutputJson(resourceFilePath),
    });

    logger.info('Updating global backend state');
    initializeGlobalBackendState(dotOpossumFilePath, isOpossumFormat);

    await openFile(mainWindow, dotOpossumFilePath);
  });
}

function getDotOpossumFilePath(resourceFilePath: string): string {
  let fileExtension: string;
  if (resourceFilePath.endsWith(jsonGzipFileExtension)) {
    fileExtension = jsonGzipFileExtension;
  } else {
    fileExtension = jsonFileExtension;
  }
  const resourceFilePathWithoutFileExtension = resourceFilePath.slice(
    0,
    -fileExtension.length,
  );

  return resourceFilePathWithoutFileExtension + OPOSSUM_FILE_EXTENSION;
}

function getInputJson(resourceFilePath: string): string {
  let inputJson: string;
  if (resourceFilePath.endsWith(jsonGzipFileExtension)) {
    const file = fs.readFileSync(resourceFilePath);
    inputJson = zlib.gunzipSync(file).toString();
  } else {
    inputJson = fs.readFileSync(resourceFilePath, {
      encoding: 'utf-8',
    });
  }

  return inputJson;
}

function getOutputJson(resourceFilePath: string): string | undefined {
  const expectedAssociatedAttributionFilePath = getFilePathWithAppendix(
    resourceFilePath,
    outputFileEnding,
  );
  if (fs.existsSync(expectedAssociatedAttributionFilePath)) {
    return fs.readFileSync(expectedAssociatedAttributionFilePath, {
      encoding: 'utf-8',
    });
  }

  return undefined;
}

export function getOpenDotOpossumFileInsteadListener(
  mainWindow: BrowserWindow,
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(mainWindow, async () => {
    const globalBackendState = getGlobalBackendState();
    const opossumFilePath = globalBackendState.opossumFilePath;
    if (!opossumFilePath) {
      throw new Error(`Resource file path is invalid: ${opossumFilePath}`);
    }
    await openFile(mainWindow, opossumFilePath);
  });
}
