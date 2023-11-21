// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { contextBridge, ipcRenderer } from 'electron';

import { IpcChannel } from '../shared/ipc-channels';
import { ElectronAPI } from '../shared/shared-types';

const electronAPI: ElectronAPI = {
  openLink: (link) => ipcRenderer.invoke(IpcChannel.OpenLink, { link }),
  openFile: () => ipcRenderer.invoke(IpcChannel.OpenFile),
  deleteFile: () => ipcRenderer.invoke(IpcChannel.DeleteFile),
  keepFile: () => ipcRenderer.invoke(IpcChannel.KeepFile),
  convertInputFileToDotOpossum: () =>
    ipcRenderer.invoke(IpcChannel.ConvertInputFile),
  useOutdatedInputFileFormat: () =>
    ipcRenderer.invoke(IpcChannel.UseOutdatedInputFile),
  openDotOpossumFile: () => ipcRenderer.invoke(IpcChannel.OpenDotOpossumFile),
  sendErrorInformation: (errorInformationArgs) =>
    ipcRenderer.invoke(IpcChannel.SendErrorInformation, errorInformationArgs),
  exportFile: (args) => ipcRenderer.invoke(IpcChannel.ExportFile, args),
  saveFile: (saveFileArgs) =>
    ipcRenderer.invoke(IpcChannel.SaveFile, saveFileArgs),
  on: (channel, listener) => {
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

// This exposes an API to communicate from the window in the frontend with the backend
// Simply exposing ipcRenderer is discouraged as it is a quite powerful API
// https://www.electronjs.org/de/docs/latest/tutorial/context-isolation
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
