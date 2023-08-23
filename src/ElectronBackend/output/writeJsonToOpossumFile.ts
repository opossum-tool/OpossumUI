// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as fflate from 'fflate';
import fs from 'fs';
import {
  OPOSSUM_FILE_COMPRESSION_LEVEL,
  OUTPUT_FILE_NAME,
} from '../shared-constants';

export async function writeOutputJsonToOpossumFile(
  opossumfilePath: string,
  outputfileData: unknown,
): Promise<void> {
  const originalZipBuffer: Buffer = await new Promise((resolve) => {
    fs.readFile(opossumfilePath, (err, data) => {
      if (err) throw err;
      resolve(data);
    });
  });

  const unzipResult: fflate.Unzipped = await new Promise((resolve) => {
    fflate.unzip(new Uint8Array(originalZipBuffer), (err, data) => {
      if (err) throw err;
      resolve(data);
    });
  });

  unzipResult[OUTPUT_FILE_NAME] = fflate.strToU8(
    JSON.stringify(outputfileData),
  );

  const zippedData: Uint8Array = await new Promise((resolve) => {
    fflate.zip(
      unzipResult,
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
    writeStream.write(zippedData, (err) => {
      if (err) throw err;
      resolve();
    });
  });
}
