// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execFile as execFileCallback } from 'child_process';
import { uniqueId } from 'lodash';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';

const execFile = promisify(execFileCallback);

const OPOSSUM_FILE_EXECUTABLE = './bin/opossum-file';

function getTempPath(): string {
  return join(tmpdir(), uniqueId('opossum_'));
}

export async function convertScanCodeToOpossum(
  pathToScanCode: string,
  pathToOutput?: string,
): Promise<string> {
  const pathToOpossum = getFilePathWithAppendix(
    pathToOutput ?? getTempPath(),
    '.opossum',
  );

  await execFile(OPOSSUM_FILE_EXECUTABLE, [
    'generate',
    '-o',
    pathToOpossum,
    '--scan-code-json',
    pathToScanCode,
  ]);
  return pathToOpossum;
}
