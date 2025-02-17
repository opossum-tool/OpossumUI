// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow } from 'electron';
import path from 'path';
import upath from 'upath';

import { getIconPath } from './iconHelpers';

export async function createWindow(): Promise<BrowserWindow> {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 500,
    minHeight: 300,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(upath.toUnix(__dirname), '../preload.js'),
    },
    icon: getIconPath(),
  });

  if (!app.isPackaged) {
    await mainWindow.loadURL('http://localhost:5173/');

    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadURL(
      `file://${path.join(upath.toUnix(__dirname), '../../index.html')}`,
    );
  }

  return mainWindow;
}
