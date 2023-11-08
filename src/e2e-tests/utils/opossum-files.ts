// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { strToU8, zip } from 'fflate';
import * as fs from 'node:fs/promises';

import type {
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../ElectronBackend/types/types';

export interface OpossumData {
  inputData: ParsedOpossumInputFile;
  outputData?: ParsedOpossumOutputFile;
  decompress?: boolean;
}

const OPOSSUM_FILE = {
  EXTENSION: 'opossum',
  COMPRESSION_LEVEL: 5,
  INPUT_NAME: 'input.json',
  OUTPUT_NAME: 'output.json',
  ASSETS_PATH: 'src/e2e-tests/temp',
} as const;

export async function createOpossumFile({
  inputData,
  outputData,
  decompress,
}: OpossumData): Promise<string> {
  await fs.mkdir(OPOSSUM_FILE.ASSETS_PATH, { recursive: true });

  const filename = inputData.metadata.projectId;

  if (decompress) {
    const filePath = `${OPOSSUM_FILE.ASSETS_PATH}/${filename}.json`;
    await fs.writeFile(
      `${OPOSSUM_FILE.ASSETS_PATH}/${filename}.json`,
      JSON.stringify(inputData),
    );
    return filePath;
  }

  const filePath = `${OPOSSUM_FILE.ASSETS_PATH}/${filename}.${OPOSSUM_FILE.EXTENSION}`;
  await fs.writeFile(
    `${OPOSSUM_FILE.ASSETS_PATH}/${filename}.${OPOSSUM_FILE.EXTENSION}`,
    await new Promise<Uint8Array>((resolve) =>
      zip(
        {
          [OPOSSUM_FILE.INPUT_NAME]: strToU8(JSON.stringify(inputData)),
          ...(outputData && {
            [OPOSSUM_FILE.OUTPUT_NAME]: strToU8(
              JSON.stringify(outputData, (_, value) =>
                value instanceof Set ? [...value] : value,
              ),
            ),
          }),
        },
        {
          level: OPOSSUM_FILE.COMPRESSION_LEVEL,
        },
        (err, data) => {
          if (err) {
            throw err;
          }
          resolve(data);
        },
      ),
    ),
  );
  return filePath;
}

export function removeTempAssets(): Promise<void> {
  return fs.rm(OPOSSUM_FILE.ASSETS_PATH, { recursive: true, force: true });
}
