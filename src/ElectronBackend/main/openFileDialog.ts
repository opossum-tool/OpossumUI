// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { dialog, BrowserWindow } from 'electron';

export function openFileDialog(): Array<string> | undefined {
  const window = BrowserWindow.getFocusedWindow();
  return window
    ? dialog.showOpenDialogSync(window, {
        properties: ['openFile'],
        filters: [
          { name: 'Opossum Input File', extensions: ['json', 'json.gz'] },
        ],
      })
    : undefined;
}
