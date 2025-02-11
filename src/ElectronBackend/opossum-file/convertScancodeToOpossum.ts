// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execFile as execFileCallback } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import { promisify } from 'util';

const execFile = promisify(execFileCallback);

const OPOSSUM_FILE_EXECUTABLE = join(
  app?.getAppPath?.() ?? './',
  process.env.NODE_ENV === 'e2e' ? '../..' : '',
  'bin/opossum-file',
);

export async function convertScancodeToOpossum(
  pathToScanCode: string,
  pathToOpossum: string,
): Promise<void> {
  try {
    await execFile(OPOSSUM_FILE_EXECUTABLE, [
      'generate',
      '-o',
      pathToOpossum,
      '--scan-code-json',
      pathToScanCode,
    ]);
  } catch (error) {
    throw new Error('Conversion of ScanCode file to .opossum file failed');
  }
}
