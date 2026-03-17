// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execFile as execFileCallback } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import { text } from '../../shared/text';
import { app } from '../electronInterop';

export abstract class FileConverter {
  protected abstract readonly fileTypeSwitch: string;
  protected abstract readonly fileTypeName: string;

  protected readonly execFile = promisify(execFileCallback);

  protected readonly OPOSSUM_FILE_EXECUTABLE = this.getOpossumFileExecutable();

  private getExecutableNames(): Array<string> {
    return process.platform === 'win32'
      ? ['opossum-file-cli.exe', 'opossum-file-cli']
      : ['opossum-file-cli'];
  }

  private getOpossumFileExecutable(): string {
    const executableNames = this.getExecutableNames();
    const candidateDirectories =
      app?.isPackaged && process.resourcesPath
        ? [join(process.resourcesPath, 'bin')]
        : [
            join(app?.getAppPath?.() ?? process.cwd(), 'bin'),
            join(app?.getAppPath?.() ?? process.cwd(), '..', '..', 'bin'),
            join(process.cwd(), 'bin'),
          ];

    const candidates = candidateDirectories.flatMap((directory) =>
      executableNames.map((executableName) => join(directory, executableName)),
    );

    return (
      candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
    );
  }

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
        this.fileTypeSwitch,
        preConvertedFilePath || toBeConvertedFilePath,
        '--opossum',
        opossumFilePath,
        '-o',
        opossumFilePath,
      ]);
    } catch (error) {
      throw new Error(text.backendError.inputFileInvalid(this.fileTypeName), {
        cause: error,
      });
    }

    if (preConvertedFilePath) {
      fs.rmSync(preConvertedFilePath);
    }
  }
}
