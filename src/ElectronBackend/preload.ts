// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannel } from '../shared/ipc-channels';
import type { ElectronAPI, UserSettings } from '../shared/shared-types';
import type { CommandName, CommandParams, CommandReturn } from './api/commands';
import {
  DbProcessClient,
  FRONTEND_TO_DB_PROCESS_PORT,
} from './dbProcess/dbProcessClient';

let client: DbProcessClient | null = null;
let resolveClientReady: () => void;
const clientReady = new Promise<void>((resolve) => {
  resolveClientReady = resolve;
});

ipcRenderer.on(FRONTEND_TO_DB_PROCESS_PORT, (event) => {
  client = new DbProcessClient(event.ports[0]);
  resolveClientReady();
});

const electronAPI: ElectronAPI = {
  api: async <C extends CommandName>(
    command: C,
    params: CommandParams<C>,
  ): Promise<Awaited<CommandReturn<C>>> => {
    await clientReady;
    return client!.api(command, params);
  },
  quit: () => ipcRenderer.invoke(IpcChannel.Quit),
  relaunch: () => ipcRenderer.invoke(IpcChannel.Relaunch),
  openLink: (link) => ipcRenderer.invoke(IpcChannel.OpenLink, { link }),
  openFile: () => ipcRenderer.invoke(IpcChannel.OpenFile),
  selectFile: (fileFormat) =>
    ipcRenderer.invoke(IpcChannel.SelectFile, fileFormat),
  importFileSelectSaveLocation: (defaultPath) =>
    ipcRenderer.invoke(IpcChannel.ImportFileSelectSaveLocation, defaultPath),
  importFileConvertAndLoad: (inputFilePath, fileType, opossumFilePath) =>
    ipcRenderer.invoke(
      IpcChannel.ImportFileConvertAndLoad,
      inputFilePath,
      fileType,
      opossumFilePath,
    ),
  mergeFileAndLoad: (inputFilePath, fileType) =>
    ipcRenderer.invoke(IpcChannel.MergeFileAndLoad, inputFilePath, fileType),
  saveFile: () => ipcRenderer.invoke(IpcChannel.SaveFile),
  exportFile: (exportType) =>
    ipcRenderer.invoke(IpcChannel.ExportFile, exportType),
  stopLoading: () => ipcRenderer.invoke(IpcChannel.StopLoading),
  on: (channel, listener) => {
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  getUserSettings: () => ipcRenderer.invoke(IpcChannel.GetUserSettings),
  updateUserSettings: (userSettings: Partial<UserSettings>) =>
    ipcRenderer.invoke(IpcChannel.UpdateUserSettings, userSettings),
  setFrontendPopupOpen: (open: boolean) =>
    ipcRenderer.invoke(IpcChannel.SetFrontendPopupOpen, open),
};

// This exposes an API to communicate from the window in the frontend with the backend
// Simply exposing ipcRenderer is discouraged as it is a quite powerful API
// https://www.electronjs.org/de/docs/latest/tutorial/context-isolation
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
