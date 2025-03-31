// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { dialog, ipcMain, systemPreferences } from 'electron';
import os from 'os';

import { IpcChannel } from '../../shared/ipc-channels';
import { UserSettings } from '../../shared/shared-types';
import { getMessageBoxContentForErrorsWrapper } from '../errorHandling/errorHandling';
import { createWindow, loadWebApp } from './createWindow';
import {
  exportFileListener,
  importFileConvertAndLoadListener,
  importFileSelectSaveLocationListener,
  mergeFileAndLoadListener,
  openFileListener,
  openLinkListener,
  saveFileListener,
  selectFileListener,
} from './listeners';
import { createMenu } from './menu';
import { openFileFromCliOrEnvVariableIfProvided } from './openFileFromCliOrEnvVariableIfProvided';
import { ProcessingStatusUpdater } from './ProcessingStatusUpdater';
import { UserSettingsService } from './user-settings-service';

export async function main(): Promise<void> {
  try {
    if (os.platform() === 'darwin') {
      systemPreferences.setUserDefault(
        'AppleShowScrollBars',
        'string',
        'Always',
      );
    }

    const mainWindow = createWindow();

    await UserSettingsService.init();
    await createMenu(mainWindow);
    const updateMenu = () => createMenu(mainWindow);

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
      openFileListener(mainWindow, updateMenu),
    );
    ipcMain.handle(IpcChannel.SelectFile, selectFileListener(mainWindow));
    ipcMain.handle(
      IpcChannel.ImportFileSelectSaveLocation,
      importFileSelectSaveLocationListener(mainWindow),
    );
    ipcMain.handle(
      IpcChannel.ImportFileConvertAndLoad,
      importFileConvertAndLoadListener(mainWindow, updateMenu),
    );
    ipcMain.handle(
      IpcChannel.MergeFileAndLoad,
      mergeFileAndLoadListener(mainWindow, updateMenu),
    );
    ipcMain.handle(IpcChannel.SaveFile, saveFileListener(mainWindow));
    ipcMain.handle(IpcChannel.ExportFile, exportFileListener(mainWindow));
    ipcMain.handle(IpcChannel.StopLoading, () =>
      new ProcessingStatusUpdater(mainWindow.webContents).endProcessing(),
    );
    ipcMain.handle(IpcChannel.OpenLink, openLinkListener);
    ipcMain.handle(IpcChannel.GetUserSettings, () => UserSettingsService.get());
    ipcMain.handle(
      IpcChannel.UpdateUserSettings,
      (_, userSettings: Partial<UserSettings>) =>
        UserSettingsService.update(userSettings, { skipNotification: true }),
    );

    await loadWebApp(mainWindow);

    await openFileFromCliOrEnvVariableIfProvided(mainWindow, updateMenu);
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
