// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindow as ElectronBrowserWindow } from 'electron';
import path from 'path';

import { app, BrowserWindow } from '../electronInterop';
import { getIconPath } from './iconHelpers';

export async function loadWebApp(
  mainWindow: Electron.CrossProcessExports.BrowserWindow,
) {
  if (!app.isPackaged) {
    await mainWindow.loadURL('http://localhost:5173/');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(
      path.join(import.meta.dirname, '..', 'index.html'),
    );
  }
}

export function createWindow(): ElectronBrowserWindow {
  return new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 500,
    minHeight: 400,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(import.meta.dirname, 'preload.mjs'),
    },
    icon: getIconPath(),
  });
}
