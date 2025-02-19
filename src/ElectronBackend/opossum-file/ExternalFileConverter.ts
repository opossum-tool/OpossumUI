// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FileConverter } from './FileConverter';

export abstract class ExternalFileConverter extends FileConverter {
  protected override preConvertFile(_: string): Promise<string | null> {
    return new Promise((resolve) => resolve(null));
  }

  override async convertToOpossum(
    toBeConvertedFilePath: string,
    opossumSaveLocation: string,
  ): Promise<void> {
    try {
      await this.execFile(this.OPOSSUM_FILE_EXECUTABLE, [
        'generate',
        '-o',
        opossumSaveLocation,
        this.fileTypeSwitch,
        toBeConvertedFilePath,
      ]);
    } catch (error) {
      throw new Error(`Input file is not a valid ${this.fileTypeName} file`);
    }
  }
}
