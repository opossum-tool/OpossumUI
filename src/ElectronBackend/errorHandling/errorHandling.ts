// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  app,
  dialog,
  MessageBoxOptions,
  MessageBoxReturnValue,
  WebContents,
} from 'electron';
import log from 'electron-log';
import { IpcChannel } from '../../shared/ipc-channels';
import { loadJsonFromFilePath } from '../input/importFromFile';
import { getGlobalBackendState } from '../main/globalBackendState';

export function createListenerCallbackWithErrorHandling(
  webContents: WebContents,
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
          webContents,
          true
        );
      } else {
        log.info('Failed executing callback function.');
        await getMessageBoxForErrors(
          'Unexpected internal error',
          '',
          webContents,
          true
        );
      }
    }
  };
}

export function getErrorDialog(
  webContents: Electron.WebContents,
  getMessageBoxContent: (errorMessage: string) => MessageBoxOptions,
  errorMessage: string
): Promise<void> {
  return dialog
    .showMessageBox(getMessageBoxContent(errorMessage))
    .then((value: MessageBoxReturnValue) =>
      performButtonAction(webContents, value.response)
    );
}

export function getMessageBoxForErrors(
  errorMessage: string,
  errorStack: string,
  webContents: WebContents,
  isBackendError: boolean
): Promise<void> {
  return getErrorDialog(
    webContents,
    getMessageBoxContentForErrorsWrapper(isBackendError, errorStack),
    errorMessage
  );
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

export function getMessageBoxForParsingError(
  errorMessage: string,
  webContents: WebContents
): Promise<void> {
  return getErrorDialog(
    webContents,
    getMessageBoxContentForParsingError,
    errorMessage
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

function performButtonAction(
  webContents: WebContents,
  buttonIndex: number
): void {
  const globalBackendState = getGlobalBackendState();
  switch (buttonIndex) {
    case 0:
      webContents.send(IpcChannel.RestoreFrontend);
      loadJsonFromFilePath(
        webContents,
        globalBackendState.resourceFilePath as string
      );
      break;
    case 1:
      app.exit(0);
      break;
    default:
      return;
  }
}
