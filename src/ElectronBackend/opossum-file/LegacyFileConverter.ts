// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import { legacyOutputFileEnding } from '../../Frontend/shared-constants';
import { text } from '../../shared/text';
import { writeOpossumFile } from '../../shared/write-file';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { FileConverter } from './FileConverter';

export class LegacyFileConverter extends FileConverter {
  readonly fileTypeName: string = 'Legacy Opossum';
  readonly fileTypeSwitch: string = '--opossum';

  private tryToGetLegacyInputJsonFromLegacyOutputJson(
    filePath: string,
  ): string {
    const outputFilePattern = `(${legacyOutputFileEnding})$`;
    const outputFileRegex = new RegExp(outputFilePattern);

    const jsonInputFilePath = filePath.replace(outputFileRegex, '.json');
    if (fs.existsSync(jsonInputFilePath)) {
      return jsonInputFilePath;
    }

    const jsonGzipInputFilePath = filePath.replace(outputFileRegex, '.json.gz');
    if (fs.existsSync(jsonGzipInputFilePath)) {
      return jsonGzipInputFilePath;
    }

    return filePath;
  }

  private readInputJson(filePath: string): string {
    let inputJson: string;
    if (filePath.endsWith('.json.gz')) {
      const file = fs.readFileSync(filePath);
      inputJson = zlib.gunzipSync(file).toString();
    } else {
      inputJson = fs.readFileSync(filePath, {
        encoding: 'utf-8',
      });
    }

    return inputJson;
  }

  private readOutputJson(filePath: string): string | undefined {
    const expectedAssociatedAttributionFilePath = getFilePathWithAppendix(
      filePath,
      legacyOutputFileEnding,
    );
    if (fs.existsSync(expectedAssociatedAttributionFilePath)) {
      return fs.readFileSync(expectedAssociatedAttributionFilePath, {
        encoding: 'utf-8',
      });
    }

    return undefined;
  }

  override async convertToOpossum(
    toBeConvertedFilePath: string,
    opossumSaveLocation: string,
  ): Promise<void> {
    let pathToInputJson = toBeConvertedFilePath;

    if (toBeConvertedFilePath.endsWith(legacyOutputFileEnding)) {
      pathToInputJson = this.tryToGetLegacyInputJsonFromLegacyOutputJson(
        toBeConvertedFilePath,
      );
    }

    try {
      await writeOpossumFile({
        path: opossumSaveLocation,
        input: this.readInputJson(pathToInputJson),
        output: this.readOutputJson(pathToInputJson),
      });
    } catch (error) {
      throw new Error(text.backendError.inputFileInvalid(this.fileTypeName));
    }
  }

  protected override async preConvertFile(
    toBeConvertedFilePath: string,
  ): Promise<string | null> {
    const tempFilePath = path.join(app.getPath('temp'), 'temp.opossum');

    await this.convertToOpossum(toBeConvertedFilePath, tempFilePath);

    return tempFilePath;
  }
}
