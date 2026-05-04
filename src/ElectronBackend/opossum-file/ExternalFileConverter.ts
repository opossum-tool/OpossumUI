// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../shared/text';
import logger from '../main/logger';
import { FileConverter } from './FileConverter';

function getOptionalStringProperty(
  value: unknown,
  propertyName: string,
): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const property = Reflect.get(value, propertyName);
  return typeof property === 'string' && property.trim()
    ? property.trim()
    : undefined;
}

function getConversionErrorDetails(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const details = [error.message];
  const stderr = getOptionalStringProperty(error, 'stderr');
  const stdout = getOptionalStringProperty(error, 'stdout');

  if (stderr) {
    details.push(`stderr: ${stderr}`);
  }

  if (stdout) {
    details.push(`stdout: ${stdout}`);
  }

  return details.join('\n');
}

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
      logger.error(
        `Failed to convert ${this.fileTypeName} input file:\n${getConversionErrorDetails(error)}`,
      );
      throw new Error(text.backendError.inputFileInvalid(this.fileTypeName), {
        cause: error,
      });
    }
  }
}
