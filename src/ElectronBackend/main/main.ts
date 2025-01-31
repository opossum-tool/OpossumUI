// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { dialog, ipcMain, Menu, systemPreferences } from 'electron';
import os from 'os';

import { IpcChannel } from '../../shared/ipc-channels';
import { getMessageBoxContentForErrorsWrapper } from '../errorHandling/errorHandling';
import { createWindow } from './createWindow';
import {
  getDeleteAndCreateNewAttributionFileListener,
  getExportFileListener,
  getImportFileConvertAndLoadListener,
  getImportFileSelectInputListener,
  getImportFileSelectSaveLocationListener,
  getOpenFileListener,
  getOpenLinkListener,
  getSaveFileListener,
} from './listeners';
import { activateMenuItems, createMenu } from './menu';
import { openFileFromCliOrEnvVariableIfProvided } from './openFileFromCliOrEnvVariableIfProvided';
import { UserSettings } from './user-settings';

export async function main(): Promise<void> {
  try {
    if (os.platform() === 'darwin') {
      systemPreferences.setUserDefault(
        'AppleShowScrollBars',
        'string',
        'Always',
      );
    }

    const mainWindow = await createWindow();

    await UserSettings.init();
    Menu.setApplicationMenu(await createMenu(mainWindow));

    mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        callback({
          requestHeaders: { ...details.requestHeaders, Origin: '*' },
        });
      },
    );

    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'access-control-allow-origin': ['*'],
            'Access-Control-Allow-Origin': [],
          },
        });
      },
    );

    ipcMain.handle(IpcChannel.Quit, () => {
      mainWindow.close();
    });
    ipcMain.handle(IpcChannel.Relaunch, () => {
      mainWindow.reload();
    });
    ipcMain.handle(
      IpcChannel.OpenFile,
      getOpenFileListener(mainWindow, activateMenuItems),
    );
    ipcMain.handle(
      IpcChannel.ImportFileSelectInput,
      getImportFileSelectInputListener(mainWindow),
    );
    ipcMain.handle(
      IpcChannel.ImportFileSelectSaveLocation,
      getImportFileSelectSaveLocationListener(mainWindow),
    );
    ipcMain.handle(
      IpcChannel.ImportFileConvertAndLoad,
      getImportFileConvertAndLoadListener(mainWindow, activateMenuItems),
    );
    ipcMain.handle(IpcChannel.SaveFile, getSaveFileListener(mainWindow));
    ipcMain.handle(
      IpcChannel.DeleteFile,
      getDeleteAndCreateNewAttributionFileListener(
        mainWindow,
        activateMenuItems,
      ),
    );
    ipcMain.handle(IpcChannel.ExportFile, getExportFileListener(mainWindow));
    ipcMain.handle(IpcChannel.OpenLink, getOpenLinkListener());
    ipcMain.handle(IpcChannel.GetUserSettings, (_, key) =>
      UserSettings.get(key),
    );
    ipcMain.handle(IpcChannel.SetUserSettings, (_, { key, value }) =>
      UserSettings.set(key, value, { skipNotification: true }),
    );

    await openFileFromCliOrEnvVariableIfProvided(mainWindow);
  } catch (error) {
    if (error instanceof Error) {
      await dialog.showMessageBox(
        getMessageBoxContentForErrorsWrapper(true, error.stack)(error.message),
      );
    } else {
      await dialog.showMessageBox(
        getMessageBoxContentForErrorsWrapper(true)('Unexpected internal error'),
      );
    }
  }
}
