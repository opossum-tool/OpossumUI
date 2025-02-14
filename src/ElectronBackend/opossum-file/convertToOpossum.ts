// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execFile as execFileCallback } from 'child_process';
import { app } from 'electron';
import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import zlib from 'zlib';

import {
  jsonFileExtension,
  jsonGzipFileExtension,
  outputFileEnding,
} from '../../Frontend/shared-constants';
import { FileType } from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';

const execFile = promisify(execFileCallback);

const OPOSSUM_FILE_EXECUTABLE = join(
  app?.getAppPath?.() ?? './',
  process.env.NODE_ENV === 'e2e' ? '../..' : '',
  'bin/opossum-file',
);

type OpossumConverter = (
  pathToInputFile: string,
  pathToOpossumFile: string,
) => Promise<void>;

function tryToGetInputFileFromOutputFile(filePath: string): string {
  const outputFilePattern = `(${outputFileEnding})$`;
  const outputFileRegex = new RegExp(outputFilePattern);

  return fs.existsSync(filePath.replace(outputFileRegex, jsonFileExtension))
    ? filePath.replace(outputFileRegex, jsonFileExtension)
    : fs.existsSync(filePath.replace(outputFileRegex, jsonGzipFileExtension))
      ? filePath.replace(outputFileRegex, jsonGzipFileExtension)
      : filePath;
}

function getInputJson(resourceFilePath: string): string {
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

function getOutputJson(resourceFilePath: string): string | undefined {
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

async function convertLegacyOpossum(
  pathToInputFile: string,
  pathToOpossumFile: string,
): Promise<void> {
  let pathToInputJson = pathToInputFile;

  if (pathToInputFile.endsWith(outputFileEnding)) {
    pathToInputJson = tryToGetInputFileFromOutputFile(pathToInputFile);
  }

  await writeOpossumFile({
    path: pathToOpossumFile,
    input: getInputJson(pathToInputJson),
    output: getOutputJson(pathToInputJson),
  });
}

function convertWithOpossumFile(
  fileTypeSwitch: string,
  fileTypeName: string,
): OpossumConverter {
  return async (pathToInputFile, pathToOpossumFile) => {
    try {
      await execFile(OPOSSUM_FILE_EXECUTABLE, [
        'generate',
        '-o',
        pathToOpossumFile,
        fileTypeSwitch,
        pathToInputFile,
      ]);
    } catch (error) {
      throw new Error(
        `Conversion of ${fileTypeName} file to .opossum file failed`,
      );
    }
  };
}

const fileTypeToConverter: Record<FileType, OpossumConverter> = {
  [FileType.LEGACY_OPOSSUM]: convertLegacyOpossum,
  [FileType.SCANCODE_JSON]: convertWithOpossumFile(
    '--scan-code-json',
    'ScanCode',
  ),
  [FileType.OWASP_JSON]: convertWithOpossumFile(
    '--owasp-json',
    'OWASP Dependency-check',
  ),
};

export async function convertToOpossum(
  pathToInputFile: string,
  pathToOpossumFile: string,
  fileType: FileType,
): Promise<void> {
  await fileTypeToConverter[fileType](pathToInputFile, pathToOpossumFile);
}
