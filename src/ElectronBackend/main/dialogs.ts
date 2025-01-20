// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';

export function openFileDialog(): Array<string> | undefined {
  const window = BrowserWindow.getFocusedWindow();
  return window
    ? dialog.showOpenDialogSync(window, {
        properties: ['openFile'],
        filters: [
          {
            name: 'Opossum Input File',
            extensions: ['opossum'],
          },
        ],
      })
    : undefined;
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
