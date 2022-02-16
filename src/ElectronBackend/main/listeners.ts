// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { BrowserWindow, shell, WebContents } from 'electron';
import { IpcChannel } from '../../shared/ipc-channels';
import {
  ExportArgsType,
  ExportCompactBomArgs,
  ExportDetailedBomArgs,
  ExportFollowUpArgs,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  OpenLinkArgs,
  SaveFileArgs,
  SendErrorInformationArgs,
} from '../../shared/shared-types';
import {
  createListenerCallbackWithErrorHandling,
  getMessageBoxForErrors,
} from '../errorHandling/errorHandling';
import { loadJsonFromFilePath } from '../input/importFromFile';
import { writeCsvToFile } from '../output/writeCsvToFile';
import { writeJsonToFile } from '../output/writeJsonToFile';
import { KeysOfAttributionInfo, OpossumOutputFile } from '../types/types';
import { getGlobalBackendState } from './globalBackendState';
import { loadApplication } from './createWindow';
import { openFileDialog, selectBaseURLDialog } from './dialogs';

import fs from 'fs';
import { writeSpdxFile } from '../output/writeSpdxFile';
import log from 'electron-log';

export function getSaveFileListener(
  webContents: WebContents
): (_: unknown, args: SaveFileArgs) => Promise<void> {
  return createListenerCallbackWithErrorHandling(
    webContents,
    (_: unknown, args: SaveFileArgs) => {
      const globalBackendState = getGlobalBackendState();

      if (
        !globalBackendState.attributionFilePath ||
        !globalBackendState.projectId
      ) {
        throw new Error(
          'Failed to save data. Either projectId or file path are incorrect.' +
            `\nprojectId: ${globalBackendState.projectId}` +
            `\nattributionFilePath: ${globalBackendState.attributionFilePath}`
        );
      } else {
        const attributionFileContent: OpossumOutputFile = {
          metadata: {
            projectId: globalBackendState.projectId,
            fileCreationDate: String(Date.now()),
          },
          manualAttributions: args.manualAttributions,
          resourcesToAttributions: args.resourcesToAttributions,
          resolvedExternalAttributions: Array.from(
            args.resolvedExternalAttributions
          ),
        };

        writeJsonToFile(
          globalBackendState.attributionFilePath,
          attributionFileContent
        );
      }
    }
  );
}

const outputFileEnding = '_attributions.json';

export function getOpenFileListener(
  mainWindow: BrowserWindow
): () => Promise<void> {
  return createListenerCallbackWithErrorHandling(
    mainWindow.webContents,
    async () => {
      const filePaths = openFileDialog();
      if (!filePaths || filePaths.length < 1) {
        return;
      }
      let filePath = filePaths[0];

      if (filePath.endsWith(outputFileEnding)) {
        filePath = tryToGetInputFileFromOutputFile(filePath);
      }

      await openFile(mainWindow, filePath);
    }
  );
}

export function getSelectBaseURLListener(webContents: WebContents): () => void {
  return createListenerCallbackWithErrorHandling(webContents, () => {
    const baseURLs = selectBaseURLDialog();
    if (!baseURLs || baseURLs.length < 1) {
      return;
    }
    const baseURL = baseURLs[0];
    const formattedBaseURL = formatBaseURL(baseURL);

    webContents.send(IpcChannel.SetBaseURLForRoot, {
      baseURLForRoot: formattedBaseURL,
    });
  });
}

function formatBaseURL(baseURL: string): string {
  return 'file://' + baseURL + '/{path}';
}

function tryToGetInputFileFromOutputFile(filePath: string): string {
  const outputFilePattern = `(${outputFileEnding})$`;
  const outputFileRegex = new RegExp(outputFilePattern);

  return fs.existsSync(filePath.replace(outputFileRegex, '.json'))
    ? filePath.replace(outputFileRegex, '.json')
    : fs.existsSync(filePath.replace(outputFileRegex, '.json.gz'))
    ? filePath.replace(outputFileRegex, '.json.gz')
    : filePath;
}

export async function openFile(
  mainWindow: BrowserWindow,
  filePath: string
): Promise<void> {
  const loadingWindow = await openLoadingWindow(mainWindow);

  try {
    await loadJsonFromFilePath(mainWindow.webContents, filePath);
    setTitle(mainWindow, filePath);
  } finally {
    loadingWindow.close();
  }
}

function setTitle(mainWindow: BrowserWindow, filePath: string): void {
  const defaultTitle = 'OpossumUI';
  mainWindow.setTitle(
    getGlobalBackendState().projectTitle ||
      decodeURIComponent(filePath.split('/').pop() || defaultTitle)
  );
}

export function getSendErrorInformationListener(
  webContents: WebContents
): (_: unknown, args: SendErrorInformationArgs) => Promise<void> {
  return async (_, args: SendErrorInformationArgs): Promise<void> => {
    log.error(args.error.message + args.errorInfo.componentStack);
    await getMessageBoxForErrors(
      args.error.message,
      args.errorInfo.componentStack,
      webContents,
      false
    );
  };
}

export function getOpenLinkListener(): (
  _: unknown,
  args: OpenLinkArgs
) => Promise<Error | void> {
  return async (_, args: OpenLinkArgs): Promise<Error | void> => {
    try {
      // Does not throw on Linux if link cannot be opened.
      // see https://github.com/electron/electron/issues/28183
      return await shell.openExternal(args.link);
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.info(`Cannot open link ${args.link}\n` + error.message);
        return error;
      } else {
        log.info(`Cannot open link ${args.link}`);
        return new Error('Cannot open link');
      }
    }
  };
}

interface FileExporterAndExportedFilePath<T> {
  exportedFilePath: string | undefined;
  fileExporter: (filePath: string, args: T) => Promise<void> | void;
}

export function getExportedFilePathAndFileExporter(
  exportType: ExportType
): FileExporterAndExportedFilePath<
  | ExportFollowUpArgs
  | ExportCompactBomArgs
  | ExportDetailedBomArgs
  | ExportSpdxDocumentYamlArgs
  | ExportSpdxDocumentJsonArgs
>;
export function getExportedFilePathAndFileExporter(
  exportType: ExportType
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

export function _exportFileAndOpenFolder(mainWindow: BrowserWindow) {
  return async (_: unknown, exportArgs: ExportArgsType): Promise<void> => {
    const { exportedFilePath, fileExporter } =
      getExportedFilePathAndFileExporter(exportArgs.type);

    const loadingWindow = await openLoadingWindow(mainWindow);

    try {
      if (exportedFilePath) {
        log.info(
          `Starting to create ${exportArgs.type} export to ${exportedFilePath}`
        );
        await fileExporter(exportedFilePath, exportArgs);
      } else {
        log.error(`Failed to create ${exportArgs.type} export.`);
        throw new Error(`Failed to create ${exportArgs.type} export.`);
      }
    } finally {
      loadingWindow.close();

      if (exportedFilePath) {
        log.info(`... Successfully created ${exportArgs.type} export`);
        shell.showItemInFolder(exportedFilePath);
      }
    }
  };
}

export function getExportFileListener(
  mainWindow: BrowserWindow
): (_: unknown, args: ExportArgsType) => Promise<void> {
  return createListenerCallbackWithErrorHandling(
    mainWindow.webContents,
    _exportFileAndOpenFolder(mainWindow)
  );
}

async function createFollowUp(
  followUpFilePath: string,
  args: ExportFollowUpArgs
): Promise<void> {
  const followUpColumnOrder: Array<KeysOfAttributionInfo> = [
    'packageName',
    'packageVersion',
    'packageNamespace',
    'packageType',
    'packagePURLAppendix',
    'url',
    'copyright',
    'licenseName',
    'licenseText',
    'excludeFromNotice',
    'resources',
  ];

  await writeCsvToFile(
    followUpFilePath,
    args.followUpAttributionsWithResources,
    followUpColumnOrder,
    true
  );
}

async function createCompactBom(
  compactBomFilePath: string,
  args: ExportCompactBomArgs
): Promise<void> {
  const miniBomColumnOrder: Array<KeysOfAttributionInfo> = [
    'packageName',
    'packageVersion',
    'licenseName',
    'copyright',
    'url',
  ];

  await writeCsvToFile(
    compactBomFilePath,
    args.bomAttributions,
    miniBomColumnOrder
  );
}

async function createDetailedBom(
  detailedBomFilePath: string,
  args: ExportDetailedBomArgs
): Promise<void> {
  const detailedBomColumnOrder: Array<KeysOfAttributionInfo> = [
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
    detailedBomColumnOrder
  );
}

async function openLoadingWindow(
  mainWindow: BrowserWindow
): Promise<BrowserWindow> {
  const loadingWindow = new BrowserWindow({
    width: 150,
    height: 150,
    parent: mainWindow,
    modal: true,
    frame: false,
    autoHideMenuBar: true,
  });
  await loadApplication(
    loadingWindow,
    '/loading.html',
    '../../loading.html',
    false
  );

  return loadingWindow;
}
