// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import JSZip from 'jszip';
import fs from 'fs';
import log from 'electron-log';
import { OPOSSUM_FILE_COMPRESSION_LEVEL } from '../shared-constants';

export async function writeOpossumFile(
  opossumfilePath: string,
  inputfileData: unknown,
  outputfileData: unknown | null
): Promise<void> {
  const writeStream = fs.createWriteStream(opossumfilePath);
  const zip = new JSZip();
  zip.file('input.json', JSON.stringify(inputfileData));
  if (outputfileData) {
    zip.file('output.json', JSON.stringify(outputfileData));
  }
  await zip
    .generateAsync({
      type: 'nodebuffer',
      streamFiles: true,
      compression: 'DEFLATE',
      compressionOptions: { level: OPOSSUM_FILE_COMPRESSION_LEVEL },
    })
    .then((output) => writeStream.write(output));
}

export async function writeOutputJsonToOpossumFile(
  opossumfilePath: string,
  outputfileData: unknown
): Promise<void> {
  const new_zip = new JSZip();

  await new Promise<void>((resolve) => {
    fs.readFile(opossumfilePath, (err, data) => {
      if (err) throw err;
      new_zip.loadAsync(data).then(() => {
        new_zip.file('output.json', JSON.stringify(outputfileData));
        const writeStream = fs.createWriteStream(opossumfilePath);
        new_zip
          .generateNodeStream({
            type: 'nodebuffer',
            streamFiles: true,
            compression: 'DEFLATE',
            compressionOptions: { level: OPOSSUM_FILE_COMPRESSION_LEVEL },
          })
          .pipe(writeStream)
          .on('finish', () => {
            log.info('opossum file was overwritten!');
            resolve();
          });
      });
    });
  });
}
