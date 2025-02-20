// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execFile as execFileCallback } from 'child_process';
import { app } from 'electron';
import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { text } from '../../shared/text';

export abstract class FileConverter {
  protected abstract readonly fileTypeSwitch: string;
  protected abstract readonly fileTypeName: string;

  protected readonly execFile = promisify(execFileCallback);

  protected readonly OPOSSUM_FILE_EXECUTABLE = join(
    app?.getAppPath?.() ?? './',
    process.env.NODE_ENV === 'e2e' ? '../..' : '',
    'bin/opossum-file',
  );

  protected abstract preConvertFile(
    toBeConvertedFilePath: string,
  ): Promise<string | null>;

  abstract convertToOpossum(
    toBeConvertedFilePath: string,
    opossumSaveLocation: string,
  ): Promise<void>;

  async mergeFileIntoOpossum(
    toBeConvertedFilePath: string,
    opossumFilePath: string,
  ): Promise<void> {
    const preConvertedFilePath = await this.preConvertFile(
      toBeConvertedFilePath,
    );

    try {
      await this.execFile(this.OPOSSUM_FILE_EXECUTABLE, [
        'generate',
        '-o',
        opossumFilePath,
        this.fileTypeSwitch,
        preConvertedFilePath || toBeConvertedFilePath,
        '--opossum',
        opossumFilePath,
      ]);
    } catch (error) {
      throw new Error(text.backendError.inputFileInvalid(this.fileTypeName));
    }

    if (preConvertedFilePath) {
      fs.rmSync(preConvertedFilePath);
    }
  }
}
