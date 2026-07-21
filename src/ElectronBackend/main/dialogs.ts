// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';

import type { FileFormatInfo } from '../../shared/shared-types';

const OPOSSUM_FILE_FILTER: Electron.FileFilter = {
  name: 'Opossum File',
  extensions: ['opossum'],
};

function showOpenDialog(
  options: Electron.OpenDialogSyncOptions,
): Array<string> | undefined {
  const window = getDialogWindow();
  return window ? dialog.showOpenDialogSync(window, options) : undefined;
}

function showSaveDialog(
  options: Electron.SaveDialogSyncOptions,
): string | undefined {
  const window = getDialogWindow();
  return window ? dialog.showSaveDialogSync(window, options) : undefined;
}

function getDialogWindow():
  Electron.CrossProcessExports.BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
}

export function openOpossumFileDialog(): Array<string> | undefined {
  return showOpenDialog({
    properties: ['openFile'],
    filters: [OPOSSUM_FILE_FILTER],
  });
}

export function openNonOpossumFileDialog(
  fileFormat: FileFormatInfo,
): Array<string> | undefined {
  return showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: `${fileFormat.name} Files (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
        extensions: fileFormat.extensions,
      },
    ],
  });
}

export function saveFileDialog(defaultPath?: string): string | undefined {
  return showSaveDialog({ defaultPath });
}

export function saveOpossumFileDialog(defaultPath: string): string | undefined {
  return showSaveDialog({
    defaultPath,
    filters: [OPOSSUM_FILE_FILTER],
  });
}

export function selectBaseURLDialog(): Array<string> | undefined {
  return showOpenDialog({
    buttonLabel: 'Select',
    properties: ['openDirectory'],
    title: 'Path to Sources',
  });
}
