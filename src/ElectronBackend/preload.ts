// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannel } from '../shared/ipc-channels';
import type { ElectronAPI, UserSettings } from '../shared/shared-types';
import type { CommandName, CommandParams, CommandReturn } from './api/commands';

// Direct MessagePort to the utility process for API commands.
// The main process transfers this port after the page starts loading.
let apiPort: MessagePort | null = null;
let resolvePortReady: () => void;
const portReady = new Promise<void>((resolve) => {
  resolvePortReady = resolve;
});

let nextApiId = 0;
const apiPending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
>();

ipcRenderer.on('utility-port', (event) => {
  apiPort = event.ports[0];
  apiPort.onmessage = (e: MessageEvent) => {
    const msg = e.data as {
      id: number;
      type: 'success' | 'error';
      result?: unknown;
      error?: string;
      stack?: string;
    };
    const p = apiPending.get(msg.id);
    if (!p) {
      return;
    }
    apiPending.delete(msg.id);
    if (msg.type === 'error') {
      const err = new Error(msg.error);
      if (msg.stack) {
        err.stack = msg.stack;
      }
      p.reject(err);
    } else {
      p.resolve(msg.result);
    }
  };
  resolvePortReady();
});

async function api<C extends CommandName>(
  command: C,
  params: CommandParams<C>,
): Promise<Awaited<CommandReturn<C>>> {
  await portReady;
  const id = nextApiId++;
  return new Promise<Awaited<CommandReturn<C>>>((resolve, reject) => {
    apiPending.set(id, {
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    apiPort!.postMessage({ id, type: 'executeCommand', command, params });
  });
}

const electronAPI: ElectronAPI = {
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
  api,
};

// This exposes an API to communicate from the window in the frontend with the backend
// Simply exposing ipcRenderer is discouraged as it is a quite powerful API
// https://www.electronjs.org/de/docs/latest/tutorial/context-isolation
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
