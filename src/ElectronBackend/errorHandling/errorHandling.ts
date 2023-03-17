// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  app,
  BrowserWindow,
  dialog,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from 'electron';
import log from 'electron-log';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import { getGlobalBackendState } from '../main/globalBackendState';
import { getOpenFileListener } from '../main/listeners';
import { getLoadedFilePath } from '../utils/getLoadedFile';

export function createListenerCallbackWithErrorHandling(
  mainWindow: BrowserWindow,
  // @ts-nocheck
  // eslint-disable-next-line @typescript-eslint/ban-types
  func: Function
): (...args: Array<unknown>) => Promise<void> {
  return async (...args: Array<unknown>): Promise<void> => {
    try {
      await func(...args);
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.info('Failed executing callback function.\n' + error.message);
        await getMessageBoxForErrors(
          error.message,
          error.stack ?? '',
          mainWindow,
          true
        );
      } else {
        log.info('Failed executing callback function.');
        await getMessageBoxForErrors(
          'Unexpected internal error',
          '',
          mainWindow,
          true
        );
      }
    }
  };
}

export function getMessageBoxForErrors(
  errorMessage: string,
  errorStack: string,
  mainWindow: BrowserWindow,
  isBackendError: boolean
): Promise<void> {
  return getErrorDialog(
    getMessageBoxContentForErrorsWrapper(isBackendError, errorStack),
    errorMessage,
    (value: MessageBoxReturnValue) =>
      performButtonAction(mainWindow, value.response)
  );
}

function getErrorDialog(
  getMessageBoxContent: (errorMessage: string) => MessageBoxOptions,
  errorMessage: string,
  performButtonActionCallback: (value: MessageBoxReturnValue) => void
): Promise<void> {
  return dialog
    .showMessageBox(getMessageBoxContent(errorMessage))
    .then(performButtonActionCallback);
}

export function getMessageBoxContentForErrorsWrapper(
  isBackendError: boolean,
  errorStack?: string
): (message: string) => MessageBoxOptions {
  return (errorMessage: string): MessageBoxOptions => {
    return {
      type: 'error',
      buttons: ['Reload File', 'Quit'],
      defaultId: 0,
      title: 'Error',
      message: `Error in app ${
        isBackendError ? 'backend' : 'frontend'
      }: ${errorMessage}`,
      detail: `Stack trace: ${errorStack || ''}`,
    };
  };
}

function performButtonAction(
  mainWindow: BrowserWindow,
  buttonIndex: number
): void {
  const globalBackendState = getGlobalBackendState();
  switch (buttonIndex) {
    case 0:
      mainWindow.webContents.send(AllowedFrontendChannels.RestoreFrontend);
      loadInputAndOutputFromFilePath(
        mainWindow,
        getLoadedFilePath(globalBackendState) as string
      );
      break;
    case 1:
      app.exit(0);
      break;
    default:
      return;
  }
}

export function getMessageBoxForParsingError(
  errorMessage: string
): Promise<void> {
  return getErrorDialog(
    getMessageBoxContentForParsingError,
    errorMessage,
    () => {
      app.exit(0);
    }
  );
}

export function getMessageBoxContentForParsingError(
  errorMessage: string
): MessageBoxOptions {
  return {
    type: 'error',
    buttons: ['Ok'],
    defaultId: 0,
    title: 'Parsing Error',
    message: 'Error parsing the input file.',
    detail: `${errorMessage}`,
  };
}

export async function getMessageBoxForInvalidDotOpossumFileError(
  filesInArchive: string,
  mainWindow: BrowserWindow
): Promise<void> {
  log.info("Error loading '.opossum' file. No 'input.json' found.");
  return getErrorDialog(
    getMessageBoxContentForInvalidDotOpossumFileError,
    filesInArchive,
    (value: MessageBoxReturnValue) =>
      performButtonActionForInvalidDotOpossumFileError(
        mainWindow,
        value.response
      )
  );
}

function getMessageBoxContentForInvalidDotOpossumFileError(
  filesInArchive: string
): MessageBoxOptions {
  return {
    type: 'error',
    buttons: ['Open New File', 'Quit'],
    defaultId: 0,
    title: 'Invalid File Error',
    message: "Error loading '.opossum' file.",
    detail:
      "The '.opossum' file is invalid as it does not contain an 'input.json'. " +
      `Actual files in the archive: ${filesInArchive}. ` +
      'Either open another file or quit the application.',
  };
}

async function performButtonActionForInvalidDotOpossumFileError(
  mainWindow: BrowserWindow,
  buttonIndex: number
): Promise<void> {
  switch (buttonIndex) {
    case 0:
      await getOpenFileListener(mainWindow)();
      break;
    case 1:
      app.exit(0);
      break;
    default:
      return;
  }
}
