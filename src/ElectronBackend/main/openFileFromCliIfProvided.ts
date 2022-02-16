// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { openFile } from './listeners';
import { BrowserWindow } from 'electron';

export async function openFileFromCliIfProvided(
  mainWindow: BrowserWindow
): Promise<void> {
  let inputFileName: string | null = null;
  for (const arg of process.argv) {
    if (arg.endsWith('.json') || arg.endsWith('.json.gz')) {
      inputFileName = arg;
      break;
    }
  }

  if (inputFileName) {
    await openFile(mainWindow, inputFileName);
  }
}
