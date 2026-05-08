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
import { getPathOfExtraResource } from '../main/getPath';

function isCliExecutionFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = Reflect.get(error, 'code');
  if (
    typeof code === 'string' &&
    ['ENOENT', 'EACCES', 'EPERM'].includes(code)
  ) {
    return true;
  }

  const syscall = Reflect.get(error, 'syscall');
  return (
    typeof syscall === 'string' &&
    (syscall.includes('spawn') || syscall.includes('exec'))
  );
}

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
    const packagedCandidates = executableNames.map((executableName) =>
      join(getPathOfExtraResource('bin'), executableName),
    );

    if (app?.isPackaged) {
      return (
        packagedCandidates.find((candidate) => fs.existsSync(candidate)) ??
        packagedCandidates[0]
      );
    }

    const appPath = app?.getAppPath?.() ?? process.cwd();
    const candidateDirectories = Array.from(
      new Set([
        join(appPath, 'bin'),
        join(appPath, '..', '..', 'bin'),
        getPathOfExtraResource('bin'),
        join(process.cwd(), 'bin'),
      ]),
    );

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

  protected createConversionError(error: unknown): Error {
    return new Error(
      isCliExecutionFailure(error)
        ? text.backendError.fileConverterExecutionFailed(this.fileTypeName)
        : text.backendError.inputFileInvalid(this.fileTypeName),
      { cause: error },
    );
  }

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
      throw this.createConversionError(error);
    }

    if (preConvertedFilePath) {
      fs.rmSync(preConvertedFilePath);
    }
  }
}
