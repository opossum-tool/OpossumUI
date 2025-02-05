// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import log from 'electron-log';

import { handleOpeningFile } from './listeners';
import { activateMenuItems } from './menu';

export async function openFileFromCliOrEnvVariableIfProvided(
  mainWindow: BrowserWindow,
): Promise<void> {
  let inputFileName: string | null = null;

  function fileHasValidEnding(arg: string): boolean {
    return arg.endsWith('.opossum');
  }

  for (const arg of process.argv) {
    if (fileHasValidEnding(arg)) {
      inputFileName = arg;
      break;
    }
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

  if (inputFileName) {
    await handleOpeningFile(mainWindow, inputFileName, activateMenuItems);
  }
}
