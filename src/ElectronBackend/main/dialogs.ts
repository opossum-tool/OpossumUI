// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';

function openFileDialog(
  filters: Array<Electron.FileFilter>,
): Array<string> | undefined {
  const window = BrowserWindow.getFocusedWindow();
  return window
    ? dialog.showOpenDialogSync(window, {
        properties: ['openFile'],
        filters,
      })
    : undefined;
}

export function openOpossumFileDialog(): Array<string> | undefined {
  const filters = [
    {
      name: 'Opossum Input File',
      extensions: ['opossum'],
    },
  ];
  return openFileDialog(filters);
}

export function openNonOpossumFileDialog(
  fileFormat: [string, Array<string>],
): Array<string> | undefined {
  const filters = [
    {
      name: `${fileFormat[0]}s (${fileFormat[1].map((ext) => `.${ext}`).join('/')})`,
      extensions: fileFormat[1],
    },
  ];
  return openFileDialog(filters);
}

export function selectBaseURLDialog(): Array<string> | undefined {
  const window = BrowserWindow.getFocusedWindow();
  return window
    ? dialog.showOpenDialogSync(window, {
        buttonLabel: 'Select',
        properties: ['openDirectory'],
        title: 'Path to Sources',
      })
    : undefined;
}
