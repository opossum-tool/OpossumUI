// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execFile as execFileCallback } from 'child_process';
import { app } from 'electron';
import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';

export abstract class FileConverter {
  protected abstract readonly fileTypeSwitch: string;
  protected abstract readonly fileTypeName: string;

  protected readonly execFile = promisify(execFileCallback);

  protected readonly OPOSSUM_FILE_EXECUTABLE = join(
    app?.getAppPath?.() ?? './',
    process.env.NODE_ENV === 'e2e' ? '../..' : '',
    'bin/opossum-file',
  );

  protected abstract preConvertInputFile(
    pathToInputFile: string,
  ): Promise<string | null>;

  abstract convertFile(
    pathToInputFile: string,
    pathToOpossumFile: string,
  ): Promise<void>;

  async mergeFiles(
    pathToInputFile: string,
    pathToOpossumFile: string,
  ): Promise<void> {
    try {
      const pathToPreConvertedInputFile =
        await this.preConvertInputFile(pathToInputFile);

      await this.execFile(this.OPOSSUM_FILE_EXECUTABLE, [
        'generate',
        '-o',
        pathToOpossumFile,
        this.fileTypeSwitch,
        pathToPreConvertedInputFile || pathToInputFile,
        '--opossum',
        pathToOpossumFile,
      ]);

      if (pathToPreConvertedInputFile) {
        fs.rmSync(pathToPreConvertedInputFile);
      }
    } catch (error) {
      throw new Error(
        `Merging ${this.fileTypeName} file into current file failed`,
      );
    }
  }
}
