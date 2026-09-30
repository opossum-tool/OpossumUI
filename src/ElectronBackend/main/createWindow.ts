// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow } from 'electron';
import path from 'path';
import upath from 'upath';

import { getIconPath } from './iconHelpers';

export async function loadWebApp(
  mainWindow: Electron.CrossProcessExports.BrowserWindow,
) {
  if (!app.isPackaged) {
    await mainWindow.loadURL('http://localhost:5173/');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(
      path.join(upath.toUnix(__dirname), '..', 'index.html'),
    );
  }
}

export function createWindow(): BrowserWindow {
  return new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 500,
    minHeight: 400,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(upath.toUnix(__dirname), 'preload.js'),
    },
    icon: getIconPath(),
  });
}
