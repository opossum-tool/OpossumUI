// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as fflate from 'fflate';
import fs from 'fs';
import {
  INPUT_FILE_NAME,
  OPOSSUM_FILE_COMPRESSION_LEVEL,
  OUTPUT_FILE_NAME,
} from '../shared-constants';
import { getGlobalBackendState } from '../main/globalBackendState';
import {
  returnPromiseOfData,
  returnPromiseOfVoid,
} from '../utils/returnPromise';

export async function writeOutputJsonToOpossumFile(
  opossumfilePath: string,
  outputfileData: unknown,
): Promise<void> {
  const unzipResult: fflate.Unzipped = {};
  unzipResult[INPUT_FILE_NAME] = getGlobalBackendState()
    .inputFileRaw as Uint8Array;
  unzipResult[OUTPUT_FILE_NAME] = fflate.strToU8(
    JSON.stringify(outputfileData),
  );

  const archive = await returnPromiseOfData<Uint8Array>(fflate.zip, [
    unzipResult,
    {
      level: OPOSSUM_FILE_COMPRESSION_LEVEL,
    },
  ]);

  const writeStream = fs.createWriteStream(opossumfilePath);
  return returnPromiseOfVoid(writeStream.write, [archive]);
}
