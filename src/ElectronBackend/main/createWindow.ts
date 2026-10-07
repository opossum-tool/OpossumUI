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
const MIN_WINDOW_WIDTH = 970;
const MIN_WINDOW_HEIGHT = 600;
const FULL_WORK_AREA_RATIO = 0.9;

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

function getInitialWindowSize(
  workAreaWidth: number,
  workAreaHeight: number,
): { width: number; height: number; maximize: boolean } {
  const fillWorkArea =
    DEFAULT_WINDOW_WIDTH >= workAreaWidth * FULL_WORK_AREA_RATIO ||
    DEFAULT_WINDOW_HEIGHT >= workAreaHeight * FULL_WORK_AREA_RATIO;
  return {
    width: fillWorkArea ? workAreaWidth : DEFAULT_WINDOW_WIDTH,
    height: fillWorkArea ? workAreaHeight : DEFAULT_WINDOW_HEIGHT,
    maximize: fillWorkArea,
  };
}

export function createWindow(): BrowserWindow {
  const {
    x: workAreaX,
    y: workAreaY,
    width: workAreaWidth,
    height: workAreaHeight,
  } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const {
    width: defaultWidth,
    height: defaultHeight,
    maximize: shouldMaximize,
  } = getInitialWindowSize(workAreaWidth, workAreaHeight);

  const newWindow = new BrowserWindow({
    x: workAreaX + Math.max(0, Math.round((workAreaWidth - defaultWidth) / 2)),
    y:
      workAreaY + Math.max(0, Math.round((workAreaHeight - defaultHeight) / 2)),
    width: defaultWidth,
    height: defaultHeight,
    minWidth: Math.min(MIN_WINDOW_WIDTH, workAreaWidth),
    minHeight: Math.min(MIN_WINDOW_HEIGHT, workAreaHeight),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(upath.toUnix(__dirname), 'preload.js'),
    },
    icon: getIconPath(),
  });
  if (shouldMaximize) {
    newWindow.maximize();
  }
  return newWindow;
}
