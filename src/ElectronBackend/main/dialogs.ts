// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';

import {
  type FileFilter,
  OPOSSUM_FILE_FORMAT,
  type SelectSaveFileOptions,
} from '../../shared/shared-types';

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
  return selectFile(OPOSSUM_FILE_FORMAT);
}

export function selectFile(fileFilter: FileFilter): Array<string> | undefined {
  return showOpenDialog({
    properties: ['openFile'],
    filters: [fileFilter],
  });
}

export function selectFiles(fileFilter: FileFilter): Array<string> | undefined {
  return showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [fileFilter],
  });
}

export function selectSaveFile({
  defaultPath,
  filter,
}: SelectSaveFileOptions): string | undefined {
  return showSaveDialog({
    defaultPath,
    filters: filter ? [filter] : undefined,
  });
}

export function selectBaseURLDialog(): Array<string> | undefined {
  return showOpenDialog({
    buttonLabel: 'Select',
    properties: ['openDirectory'],
    title: 'Path to Sources',
  });
}
