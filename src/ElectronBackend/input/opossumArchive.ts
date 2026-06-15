// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as fflate from 'fflate';
import fs from 'fs';

import {
  INPUT_FILE_NAME,
  OUTPUT_FILE_NAME,
} from '../../shared/write-file-utils';

// First two bytes of the local-file-header signature ('P', 'K').
const ZIP_MAGIC_BYTE_0 = 0x50;
const ZIP_MAGIC_BYTE_1 = 0x4b;

export interface OpossumArchive {
  /** `null` if the archive did not contain an input file. */
  inputBytes: Uint8Array | null;
  /** `null` if the archive did not contain an output file. */
  outputBytes: Uint8Array | null;
}

/**
 * Streams an `.opossum` archive into memory, returning the decompressed bytes
 * of its input and output files when present.
 */
export async function readOpossumArchive(
  opossumFilePath: string,
): Promise<OpossumArchive> {
  let inputChunks: Uint8Array[] | null = null;
  let outputChunks: Uint8Array[] | null = null;

  const collect = (file: fflate.UnzipFile): Uint8Array[] => {
    const chunks: Uint8Array[] = [];
    file.ondata = (err, chunk) => {
      if (err) {
        throw err;
      }
      chunks.push(chunk);
    };
    file.start();
    return chunks;
  };

  const unzipper = new fflate.Unzip();
  unzipper.register(fflate.UnzipInflate);
  unzipper.onfile = (file) => {
    if (file.name === INPUT_FILE_NAME) {
      inputChunks = collect(file);
    } else if (file.name === OUTPUT_FILE_NAME) {
      outputChunks = collect(file);
    }
  };

  if (!(await isZipFile(opossumFilePath))) {
    throw new Error(`${opossumFilePath} is not a valid zip archive`);
  }

  try {
    for await (const chunk of fs.createReadStream(opossumFilePath)) {
      unzipper.push(chunk as Uint8Array, false);
    }
    unzipper.push(new Uint8Array(0), true);
  } catch (err) {
    throw new Error(
      `${opossumFilePath} could not be unzipped: ${String(err)}`,
      { cause: err },
    );
  }

  return {
    inputBytes: inputChunks && Buffer.concat(inputChunks),
    outputBytes: outputChunks && Buffer.concat(outputChunks),
  };
}

/**
 * Sniffs the first two bytes for the zip local-file-header signature.
 * fflate's streaming `Unzip` silently ignores bytes that aren't a valid header,
 * so without this check non-zip input would parse as an archive with no entries.
 */
async function isZipFile(filePath: string): Promise<boolean> {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const { bytesRead, buffer } = await fd.read({
      buffer: Buffer.alloc(2),
      position: 0,
    });
    return (
      bytesRead === 2 &&
      buffer[0] === ZIP_MAGIC_BYTE_0 &&
      buffer[1] === ZIP_MAGIC_BYTE_1
    );
  } finally {
    await fd.close();
  }
}
