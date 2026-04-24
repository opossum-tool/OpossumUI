// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, dialog } from 'electron';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { text } from '../../shared/text';
import { getMainDbClient } from '../dbProcess/dbProcessClient';
import { getGlobalBackendState } from '../main/globalBackendState';
import { ProcessingStatusUpdater } from '../main/ProcessingStatusUpdater';
import { type ParsingError } from '../types/types';

async function handleParsingError(
  parsingError: ParsingError,
  processingStatusUpdater: ProcessingStatusUpdater,
) {
  processingStatusUpdater.info('Invalid input file');
  switch (parsingError.type) {
    case 'unzipError':
      await getMessageBoxForUnzipError(parsingError.message);
      return;
    case 'fileNotFoundError':
      await getMessageBoxForFileNotFoundError(parsingError.message);
      return;
    case 'jsonParsingError':
      await getMessageBoxForParsingError(parsingError.message);
      return;
    case 'invalidDotOpossumFileError':
      processingStatusUpdater.endProcessing();
      await getMessageBoxForInvalidDotOpossumFileError(parsingError.message);
  }
}

export async function loadInputAndOutputFromFilePath(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  mainWindow.webContents.send(AllowedFrontendChannels.ResetLoadedFile, {
    resetState: true,
  });
  mainWindow.webContents.send(
    AllowedFrontendChannels.SetDatabaseInitialized,
    false,
  );

  const processingStatusUpdater = new ProcessingStatusUpdater(
    mainWindow.webContents,
  );

  const globalState = getGlobalBackendState();
  const result = await getMainDbClient().loadFile(
    filePath,
    { inputFileChecksum: globalState.inputFileChecksum },
    (message, level) => {
      if (level === 'warn') {
        processingStatusUpdater.warn(message);
      } else {
        processingStatusUpdater.info(message);
      }
    },
  );

  if (!result.ok) {
    await handleParsingError(result.error, processingStatusUpdater);
    return;
  }

  mainWindow.webContents.send(
    AllowedFrontendChannels.SetDatabaseInitialized,
    true,
  );

  processingStatusUpdater.info('Finalizing global state');
  globalState.projectTitle = result.projectTitle;
  globalState.projectId = result.projectId;
}

async function getMessageBoxForParsingError(
  errorMessage: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Parsing Error',
    message: 'Error parsing the input file.',
    detail: `${errorMessage}\n${text.errorBoundary.outdatedAppVersion}`,
  });
}

async function getMessageBoxForFileNotFoundError(
  errorMessage: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'File Not Found Error',
    message: 'An error occurred while trying to open the file.',
    detail: `${errorMessage}`,
  });
}

async function getMessageBoxForUnzipError(errorMessage: string): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Unzipping Error',
    message: 'An error occurred while trying to unzip the file.',
    detail: `${errorMessage}`,
  });
}

async function getMessageBoxForInvalidDotOpossumFileError(
  filesInArchive: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Invalid File Error',
    message: "Error loading '.opossum' file.",
    detail:
      "The '.opossum' file is invalid as it does not contain an 'input.json'. " +
      `Actual files in the archive: ${filesInArchive}.`,
  });
}
