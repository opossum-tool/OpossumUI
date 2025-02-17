// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FileConverter } from './FileConverter';

export abstract class ExternalFileConverter extends FileConverter {
  protected override preConvertInputFile(_: string): Promise<string | null> {
    return new Promise((resolve) => resolve(null));
  }

  override async convertFile(
    pathToInputFile: string,
    pathToOpossumFile: string,
  ): Promise<void> {
    try {
      await this.execFile(this.OPOSSUM_FILE_EXECUTABLE, [
        'generate',
        '-o',
        pathToOpossumFile,
        this.fileTypeSwitch,
        pathToInputFile,
      ]);
    } catch (error) {
      throw new Error(
        `Conversion of ${this.fileTypeName} file to .opossum file failed`,
      );
    }
  }
}
