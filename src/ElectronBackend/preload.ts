// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ipcRenderer, contextBridge } from 'electron';
import { AllowedFrontendChannels, IpcChannel } from '../shared/ipc-channels';
import {
  SendErrorInformationArgs,
  IElectronAPI,
  ExportArgsType,
  Listener,
  SaveFileArgs,
} from '../shared/shared-types';

function on(channel: AllowedFrontendChannels, listener: Listener): void {
  if (Object.values(AllowedFrontendChannels).includes(channel)) {
    ipcRenderer.on(channel, listener);
  }
}

function removeListener(
  channel: AllowedFrontendChannels,
  listener: Listener
): void {
  if (Object.values(AllowedFrontendChannels).includes(channel)) {
    ipcRenderer.removeListener(channel, listener);
  }
}

const electronAPI: IElectronAPI = {
  openLink: (link: string) => ipcRenderer.invoke(IpcChannel.OpenLink, { link }),
  openFile: () => ipcRenderer.invoke(IpcChannel.OpenFile),
  sendErrorInformation: (errorInformationArgs: SendErrorInformationArgs) =>
    ipcRenderer.invoke(IpcChannel.SendErrorInformation, errorInformationArgs),
  exportFile: (args: ExportArgsType) =>
    ipcRenderer.invoke(IpcChannel.ExportFile, args),
  saveFile: (saveFileArgs: SaveFileArgs) =>
    ipcRenderer.invoke(IpcChannel.SaveFile, saveFileArgs),
  on,
  removeListener,
};

// This exposes an API to communicate from the window in the frontend with the backend
// Simply exposing ipcRenderer is discouraged as it is a quite powerful API
// https://www.electronjs.org/de/docs/latest/tutorial/context-isolation
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
