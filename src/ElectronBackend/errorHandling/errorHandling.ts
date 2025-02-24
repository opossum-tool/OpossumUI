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

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { loadInputAndOutputFromFilePath } from '../input/importFromFile';
import { getGlobalBackendState } from '../main/globalBackendState';
import logger from '../main/logger';
import { getLoadedFilePath } from '../utils/getLoadedFile';

export async function showListenerErrorInMessageBox(
  mainWindow: BrowserWindow,
  error: unknown,
): Promise<void> {
  if (error instanceof Error) {
    logger.info(`Failed executing callback function: ${error.message}`);
    await getMessageBoxForErrors(
      error.message,
      error.stack ?? '',
      mainWindow,
      true,
    );
  } else {
    logger.info('Failed executing callback function.');
    await getMessageBoxForErrors(
      'Unexpected internal error',
      '',
      mainWindow,
      true,
    );
  }
}

export function sendListenerErrorToFrontend(
  _: BrowserWindow,
  error: unknown,
): void {
  // NOTE: these log messages are forwarded to the frontend
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error('Unexpected internal error');
  }
}

export function getMessageBoxForErrors(
  errorMessage: string,
  errorStack: string | null | undefined,
  mainWindow: BrowserWindow,
  isBackendError: boolean,
): Promise<void> {
  return getErrorDialog(
    getMessageBoxContentForErrorsWrapper(isBackendError, errorStack),
    errorMessage,
    (value: MessageBoxReturnValue) =>
      performButtonAction(mainWindow, value.response),
  );
}

function getErrorDialog(
  getMessageBoxContent: (errorMessage: string) => MessageBoxOptions,
  errorMessage: string,
  performButtonActionCallback: (value: MessageBoxReturnValue) => void,
): Promise<void> {
  return dialog
    .showMessageBox(getMessageBoxContent(errorMessage))
    .then(performButtonActionCallback);
}

export function getMessageBoxContentForErrorsWrapper(
  isBackendError: boolean,
  errorStack?: string | null | undefined,
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
  buttonIndex: number,
): void {
  const globalBackendState = getGlobalBackendState();
  switch (buttonIndex) {
    case 0:
      mainWindow.webContents.send(AllowedFrontendChannels.RestoreFrontend);
      void loadInputAndOutputFromFilePath(
        mainWindow,
        getLoadedFilePath(globalBackendState) as string,
      );
      break;
    case 1:
      app.exit(0);
      break;
    default:
  }
}
