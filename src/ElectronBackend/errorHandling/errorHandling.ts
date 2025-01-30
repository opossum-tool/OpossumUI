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

async function reportListenerError(
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

type FuncType<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => R
  : never;

type RemovePromise<A> = A extends Promise<infer B> ? B : A;
type ReturnTypeWithoutPromise<A> =
  A extends FuncType<A> ? RemovePromise<ReturnType<A>> : never;
type FTParameters<A> = A extends FuncType<A> ? Parameters<A> : never;

export function createVoidListenerCallbackWithErrorHandling<F>(
  mainWindow: BrowserWindow,
  func: F & FuncType<F>,
): (...args: FTParameters<F>) => Promise<void> {
  return async (...args: FTParameters<F>): Promise<void> => {
    try {
      await func(...args);
    } catch (error: unknown) {
      await reportListenerError(mainWindow, error);
    }
  };
}

export function createListenerCallbackWithErrorHandling<F>(
  mainWindow: BrowserWindow,
  func: F & FuncType<F>,
): (...args: FTParameters<F>) => Promise<ReturnTypeWithoutPromise<F> | null> {
  return async (
    ...args: FTParameters<F>
  ): Promise<ReturnTypeWithoutPromise<F> | null> => {
    try {
      return (await func(...args)) as ReturnTypeWithoutPromise<F>;
    } catch (error: unknown) {
      await reportListenerError(mainWindow, error);
      return Promise.resolve(null);
    }
  };
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
