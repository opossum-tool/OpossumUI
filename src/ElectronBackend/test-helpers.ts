// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { v4 as uuid4 } from 'uuid';
import * as fflate from 'fflate';
import {
  INPUT_FILE_NAME,
  OPOSSUM_FILE_COMPRESSION_LEVEL,
  OUTPUT_FILE_NAME,
} from './shared-constants';

export function createTempFolder(): string {
  return fs.mkdtempSync(`temp-folder-${uuid4()}`);
}

export function deleteFolder(folderPath: string): void {
  fs.rm(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
  });
}

export async function writeOpossumFile(
  opossumfilePath: string,
  inputfileData: unknown,
  outputfileData: unknown | null,
): Promise<void> {
  const dataToZip: fflate.Zippable = {
    [INPUT_FILE_NAME]: fflate.strToU8(JSON.stringify(inputfileData)),
  };
  if (outputfileData) {
    dataToZip[OUTPUT_FILE_NAME] = fflate.strToU8(
      JSON.stringify(outputfileData),
    );
  }

  const archive: Uint8Array = await new Promise((resolve) => {
    fflate.zip(
      dataToZip,
      {
        level: OPOSSUM_FILE_COMPRESSION_LEVEL,
      },
      (err, data) => {
        if (err) throw err;
        resolve(data);
      },
    );
  });

  const writeStream = fs.createWriteStream(opossumfilePath);
  return new Promise((resolve) => {
    writeStream.write(archive, (err) => {
      if (err) throw err;
      resolve();
    });
  });
}
