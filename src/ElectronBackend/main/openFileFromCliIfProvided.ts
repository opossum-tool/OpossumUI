// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';

import { handleOpeningFile } from './listeners';

export async function openFileFromCliIfProvided(
  mainWindow: BrowserWindow,
): Promise<void> {
  let inputFileName: string | null = null;
  for (const arg of process.argv) {
    if (
      arg.endsWith('.json') ||
      arg.endsWith('.json.gz') ||
      arg.endsWith('.opossum')
    ) {
      inputFileName = arg;
      break;
    }
  }

  if (inputFileName) {
    await handleOpeningFile(mainWindow, inputFileName);
  }
}
