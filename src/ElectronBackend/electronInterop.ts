// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as electronModule from 'electron';

type ElectronModule = typeof electronModule;
type ElectronInteropModule = ElectronModule & { default?: ElectronModule };

function isElectronModule(value: unknown): value is ElectronModule {
  return typeof value === 'object' && value !== null;
}

function resolveElectronModule(module: ElectronInteropModule): ElectronModule {
  const defaultElectron = Object.getOwnPropertyDescriptor(
    module,
    'default',
  )?.value;

  return isElectronModule(defaultElectron) ? defaultElectron : module;
}

const electron = resolveElectronModule(electronModule);

export const {
  app,
  BrowserWindow,
  contextBridge,
  dialog,
  ipcMain,
  ipcRenderer,
  Menu,
  shell,
  systemPreferences,
} = electron;

export default electron;

export type {
  MenuItemConstructorOptions,
  MessageBoxOptions,
  MessageBoxReturnValue,
  WebContents,
} from 'electron';
