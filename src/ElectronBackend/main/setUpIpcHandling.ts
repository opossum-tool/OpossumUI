// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, type BrowserWindow, ipcMain } from 'electron';

import { IpcChannel } from '../../shared/ipc-channels';
import type { UserSettings } from '../../shared/shared-types';
import { getAppVersion } from './app-version';
import { getGlobalBackendState } from './globalBackendState';
import {
  exportFileListener,
  forceUnlockCurrentOpossumFileListener,
  importFileConvertAndLoadListener,
  mergeCurrentOpossumFilesListener,
  mergeFileAndLoadListener,
  mergeOpossumFilesFromPathsListener,
  openFileListener,
  openLinkListener,
  saveFileListener,
  selectFileListener,
  selectFilesListener,
  selectSaveFileListener,
  selectSplitDestinationListener,
  splitCurrentOpossumFileListener,
} from './listeners';
import { getMacArchitectureMismatch } from './mac-architecture';
import { ProcessingStatusUpdater } from './ProcessingStatusUpdater';
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  installDownloadedUpdate,
} from './update-service';
import { UserSettingsService } from './user-settings-service';

export function setupIpcHandling(
  window: BrowserWindow,
  updateMenu: () => Promise<void>,
) {
  ipcMain.handle(IpcChannel.Quit, () => {
    window.close();
  });
  ipcMain.handle(IpcChannel.Relaunch, () => {
    window.reload();
  });
  ipcMain.handle(IpcChannel.OpenFile, openFileListener(window, updateMenu));
  ipcMain.handle(IpcChannel.SelectFile, selectFileListener(window));
  ipcMain.handle(IpcChannel.SelectFiles, selectFilesListener(window));
  ipcMain.handle(IpcChannel.SelectSaveFile, selectSaveFileListener(window));
  ipcMain.handle(
    IpcChannel.ImportFileConvertAndLoad,
    importFileConvertAndLoadListener(window, updateMenu),
  );
  ipcMain.handle(
    IpcChannel.MergeFileAndLoad,
    mergeFileAndLoadListener(window, updateMenu),
  );
  ipcMain.handle(IpcChannel.SaveFile, saveFileListener(window));
  ipcMain.handle(
    IpcChannel.ForceUnlock,
    forceUnlockCurrentOpossumFileListener(window, updateMenu),
  );
  ipcMain.handle(
    IpcChannel.SelectSplitDestination,
    selectSplitDestinationListener(window),
  );
  ipcMain.handle(IpcChannel.SplitFile, splitCurrentOpossumFileListener(window));
  ipcMain.handle(
    IpcChannel.MergeOpossumFiles,
    mergeCurrentOpossumFilesListener(window),
  );
  ipcMain.handle(
    IpcChannel.MergeOpossumFilesFromPaths,
    mergeOpossumFilesFromPathsListener.bind(undefined, window),
  );
  ipcMain.handle(IpcChannel.ExportFile, exportFileListener(window));
  ipcMain.handle(IpcChannel.StopLoading, () =>
    new ProcessingStatusUpdater(window.webContents).endProcessing(),
  );
  ipcMain.handle(IpcChannel.OpenLink, openLinkListener);
  ipcMain.handle(IpcChannel.GetUserSettings, () => UserSettingsService.get());
  ipcMain.handle(
    IpcChannel.UpdateUserSettings,
    (_, userSettings: Partial<UserSettings>) =>
      UserSettingsService.update(userSettings, { skipNotification: true }),
  );
  ipcMain.handle(IpcChannel.SetFrontendPopupOpen, async (_, open: boolean) => {
    getGlobalBackendState().frontendPopupOpen = open;
    await updateMenu();
  });
  ipcMain.handle(IpcChannel.GetMacArchitectureMismatch, () =>
    getMacArchitectureMismatch(
      process.platform,
      app.runningUnderARM64Translation,
    ),
  );
  ipcMain.handle(IpcChannel.RestartAndUpdate, installDownloadedUpdate);
  ipcMain.handle(IpcChannel.GetUpdateState, getUpdateState);
  ipcMain.handle(IpcChannel.GetAppVersion, getAppVersion);
  ipcMain.handle(IpcChannel.CheckForUpdates, checkForUpdates);
  ipcMain.handle(IpcChannel.DownloadUpdate, (_, tag: string) =>
    downloadUpdate(tag),
  );
}
