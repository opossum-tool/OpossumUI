// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';

import type { FileFormatInfo } from '../../shared/shared-types';

function openFileDialog(
  filters: Array<Electron.FileFilter>,
): Array<string> | undefined {
  const window = getDialogWindow();
  return window
    ? dialog.showOpenDialogSync(window, {
        properties: ['openFile'],
        filters,
      })
    : undefined;
}

function getDialogWindow():
  Electron.CrossProcessExports.BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
}

export function openOpossumFileDialog(): Array<string> | undefined {
  return openFileDialog([
    {
      name: 'Opossum File',
      extensions: ['opossum'],
    },
  ]);
}

export function openNonOpossumFileDialog(
  fileFormat: FileFormatInfo,
): Array<string> | undefined {
  return openFileDialog([
    {
      name: `${fileFormat.name} Files (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
      extensions: fileFormat.extensions,
    },
  ]);
}

export function saveFileDialog(defaultPath?: string): string | undefined {
  const window = getDialogWindow();
  return window
    ? dialog.showSaveDialogSync(window, { defaultPath })
    : undefined;
}

export function selectBaseURLDialog(): Array<string> | undefined {
  const window = getDialogWindow();
  return window
    ? dialog.showOpenDialogSync(window, {
        buttonLabel: 'Select',
        properties: ['openDirectory'],
        title: 'Path to Sources',
      })
    : undefined;
}
