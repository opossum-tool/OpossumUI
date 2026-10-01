// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import upath from 'upath';

import { getIconPath } from './iconHelpers';

const DEFAULT_WINDOW_WIDTH = 1920;
const DEFAULT_WINDOW_HEIGHT = 1080;
const MIN_WINDOW_WIDTH = 500;
const MIN_WINDOW_HEIGHT = 400;

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
  const { width: workAreaWidth, height: workAreaHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  return new BrowserWindow({
    width: Math.min(DEFAULT_WINDOW_WIDTH, workAreaWidth),
    height: Math.min(DEFAULT_WINDOW_HEIGHT, workAreaHeight),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(upath.toUnix(__dirname), 'preload.js'),
    },
    icon: getIconPath(),
  });
}
