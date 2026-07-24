// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, ipcMain } from 'electron';

import { IpcChannel } from '../../shared/ipc-channels';
import type { UserSettings } from '../../shared/shared-types';
import { LoadedFileFormat } from '../enums/enums';
import { getLoadedFileType } from '../utils/getLoadedFile';
import { getGlobalBackendState } from './globalBackendState';
import {
  exportFileListener,
  importFileConvertAndLoadListener,
  importFileSelectSaveLocationListener,
  mergeFileAndLoadListener,
  openFileListener,
  openLinkListener,
  saveFileListener,
  selectFileListener,
  selectSplitDestinationListener,
  splitCurrentOpossumFileListener,
} from './listeners';
import { ProcessingStatusUpdater } from './ProcessingStatusUpdater';
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
  ipcMain.handle(
    IpcChannel.ImportFileSelectSaveLocation,
    importFileSelectSaveLocationListener(window),
  );
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
    IpcChannel.SelectSplitDestination,
    selectSplitDestinationListener(window),
  );
  ipcMain.handle(IpcChannel.IsOpossumFileLoaded, () => {
    const globalBackendState = getGlobalBackendState();
    return getLoadedFileType(globalBackendState) === LoadedFileFormat.Opossum;
  });
  ipcMain.handle(IpcChannel.SplitFile, splitCurrentOpossumFileListener(window));
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
}
