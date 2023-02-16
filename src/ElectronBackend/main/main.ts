// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  systemPreferences,
} from 'electron';
import { IpcChannel } from '../../shared/ipc-channels';
import { getMessageBoxContentForErrorsWrapper } from '../errorHandling/errorHandling';
import { createWindow } from './createWindow';
import {
  getExportFileListener,
  getOpenFileListener,
  getOpenLinkListener,
  getDeleteAndCreateNewAttributionFileListener,
  getSaveFileListener,
  getSendErrorInformationListener,
  getKeepFileListener,
  getConvertInputFileToDotOpossumAndOpenListener,
  getOpenOutdatedInputFileListener,
  getOpenDotOpossumFileInsteadListener,
} from './listeners';
import { installExtensionsForDev } from './installExtensionsForDev';
import os from 'os';
import { openFileFromCliIfProvided } from './openFileFromCliIfProvided';

export async function main(): Promise<void> {
  try {
    installExtensionsForDev();

    if (os.platform() === 'darwin') {
      systemPreferences.setUserDefault(
        'AppleShowScrollBars',
        'string',
        'Always'
      );
    }

    const mainWindow = await createWindow();
    const webContents = mainWindow.webContents;

    ipcMain.handle(
      IpcChannel.ConvertInputFile,
      getConvertInputFileToDotOpossumAndOpenListener(mainWindow)
    );
    ipcMain.handle(
      IpcChannel.UseOutdatedInputFile,
      getOpenOutdatedInputFileListener(mainWindow)
    );
    ipcMain.handle(
      IpcChannel.OpenDotOpossumFile,
      getOpenDotOpossumFileInsteadListener(mainWindow)
    );
    ipcMain.handle(IpcChannel.OpenFile, getOpenFileListener(mainWindow));
    ipcMain.handle(IpcChannel.SaveFile, getSaveFileListener(webContents));
    ipcMain.handle(
      IpcChannel.DeleteFile,
      getDeleteAndCreateNewAttributionFileListener(mainWindow)
    );
    ipcMain.handle(IpcChannel.KeepFile, getKeepFileListener(mainWindow));
    ipcMain.handle(
      IpcChannel.SendErrorInformation,
      getSendErrorInformationListener(webContents)
    );
    ipcMain.handle(IpcChannel.ExportFile, getExportFileListener(mainWindow));
    ipcMain.handle(IpcChannel.OpenLink, getOpenLinkListener());

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    await openFileFromCliIfProvided(mainWindow);
  } catch (error) {
    if (error instanceof Error) {
      await dialog.showMessageBox(
        getMessageBoxContentForErrorsWrapper(true, error.stack)(error.message)
      );
    } else {
      await dialog.showMessageBox(
        getMessageBoxContentForErrorsWrapper(true)('Unexpected internal error')
      );
    }
  }
}
