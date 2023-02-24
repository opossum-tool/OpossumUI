// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import JSZip from 'jszip';
import fs from 'fs';

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
      compressionOptions: { level: 1 },
    })
    .then((output) => writeStream.write(output));
}
