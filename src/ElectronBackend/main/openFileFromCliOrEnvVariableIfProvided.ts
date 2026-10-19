// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindow } from 'electron';
import log from 'electron-log';
import fs from 'fs';

import { getLastDevFile } from '../db/dev-db-cache';
import { handleOpeningFile } from './listeners';
import {
  clearPendingMacOsOpenFilePaths,
  consumeStartupMacOsOpenFilePath,
} from './openFileRequests';

export async function openFileFromCliOrEnvVariableIfProvided(
  mainWindow: BrowserWindow,
  updateMenu: () => Promise<void>,
  options: { reopenLastDevFile?: boolean } = {},
): Promise<void> {
  let inputFileName: string | null = null;

  function fileHasValidEnding(arg: string): boolean {
    return arg.endsWith('.opossum');
  }

  for (const arg of process.argv) {
    if (fileHasValidEnding(arg)) {
      inputFileName = arg;
      clearPendingMacOsOpenFilePaths();
      break;
    }
  }

  if (!inputFileName) {
    inputFileName = consumeStartupMacOsOpenFilePath();
  }

  const inputFileFromEnvVariable: string | undefined = process.env.OPOSSUM_FILE;
  if (!inputFileName && inputFileFromEnvVariable) {
    if (fileHasValidEnding(inputFileFromEnvVariable)) {
      inputFileName = inputFileFromEnvVariable;
    } else {
      log.warn(
        `File "${inputFileFromEnvVariable}"  which was provided by env variable is not valid. ` +
          'Opening OpossumUI without loading a file.',
      );
    }
  }

  if (!inputFileName && options.reopenLastDevFile) {
    // Development-only convenience: after a backend code change Electron
    // restarts and immediately restores the previously loaded file from the
    // dev DB cache.
    const lastDevFile = getLastDevFile();
    if (lastDevFile?.endsWith('.opossum') && fs.existsSync(lastDevFile)) {
      inputFileName = lastDevFile;
    }
  }

  if (inputFileName) {
    await handleOpeningFile(mainWindow, inputFileName, updateMenu);
  }
}
