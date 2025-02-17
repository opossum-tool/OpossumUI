// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FileType } from '../../shared/shared-types';
import { ExternalFileConverter } from './ExternalFileConverter';
import { FileConverter } from './FileConverter';
import { LegacyFileConverter } from './LegacyFileConverter';

const fileTypeToConverter: Record<FileType, FileConverter> = {
  [FileType.LEGACY_OPOSSUM]: new LegacyFileConverter(),
  [FileType.SCANCODE_JSON]: new (class extends ExternalFileConverter {
    readonly fileTypeSwitch: string = '--scan-code-json';
    readonly fileTypeName: string = 'ScanCode';
  })(),
  [FileType.OWASP_JSON]: new (class extends ExternalFileConverter {
    readonly fileTypeSwitch: string = '--owasp-json';
    readonly fileTypeName: string = 'OWASP Dependency-check';
  })(),
};

export async function convertToOpossum(
  pathToInputFile: string,
  pathToOpossumFile: string,
  fileType: FileType,
): Promise<void> {
  await fileTypeToConverter[fileType].convertFile(
    pathToInputFile,
    pathToOpossumFile,
  );
}

export async function mergeFiles(
  pathToInputFile: string,
  pathToOpossumFile: string,
  fileType: FileType,
): Promise<void> {
  await fileTypeToConverter[fileType].mergeFiles(
    pathToInputFile,
    pathToOpossumFile,
  );
}
