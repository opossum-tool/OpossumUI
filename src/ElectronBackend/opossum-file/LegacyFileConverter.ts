// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import {
  jsonFileExtension,
  jsonGzipFileExtension,
  outputFileEnding,
} from '../../Frontend/shared-constants';
import { writeOpossumFile } from '../../shared/write-file';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { FileConverter } from './FileConverter';

export class LegacyFileConverter extends FileConverter {
  readonly fileTypeName: string = 'Legacy Opossum';
  readonly fileTypeSwitch: string = '--opossum';

  private tryToGetInputFileFromOutputFile(filePath: string): string {
    const outputFilePattern = `(${outputFileEnding})$`;
    const outputFileRegex = new RegExp(outputFilePattern);

    return fs.existsSync(filePath.replace(outputFileRegex, jsonFileExtension))
      ? filePath.replace(outputFileRegex, jsonFileExtension)
      : fs.existsSync(filePath.replace(outputFileRegex, jsonGzipFileExtension))
        ? filePath.replace(outputFileRegex, jsonGzipFileExtension)
        : filePath;
  }

  private getInputJson(resourceFilePath: string): string {
    let inputJson: string;
    if (resourceFilePath.endsWith(jsonGzipFileExtension)) {
      const file = fs.readFileSync(resourceFilePath);
      inputJson = zlib.gunzipSync(file).toString();
    } else {
      inputJson = fs.readFileSync(resourceFilePath, {
        encoding: 'utf-8',
      });
    }

    return inputJson;
  }

  private getOutputJson(resourceFilePath: string): string | undefined {
    const expectedAssociatedAttributionFilePath = getFilePathWithAppendix(
      resourceFilePath,
      outputFileEnding,
    );
    if (fs.existsSync(expectedAssociatedAttributionFilePath)) {
      return fs.readFileSync(expectedAssociatedAttributionFilePath, {
        encoding: 'utf-8',
      });
    }

    return undefined;
  }

  override async convertFile(
    pathToInputFile: string,
    pathToOpossumFile: string,
  ): Promise<void> {
    let pathToInputJson = pathToInputFile;

    if (pathToInputFile.endsWith(outputFileEnding)) {
      pathToInputJson = this.tryToGetInputFileFromOutputFile(pathToInputFile);
    }

    await writeOpossumFile({
      path: pathToOpossumFile,
      input: this.getInputJson(pathToInputJson),
      output: this.getOutputJson(pathToInputJson),
    });
  }

  protected override async preConvertInputFile(
    pathToInputFile: string,
  ): Promise<string | null> {
    let tempFilePath;
    try {
      tempFilePath = path.join(app.getPath('temp'), 'temp.opossum');
    } catch (error) {
      // When executing as part of unit tests, app.getPath('temp') throws an error
      tempFilePath = path.join(__dirname, 'temp.opossum');
    }

    console.log(`Temp file path: ${tempFilePath}`);

    await this.convertFile(pathToInputFile, tempFilePath);

    return tempFilePath;
  }
}
