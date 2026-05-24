// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { serializeAttributions } from '../input/parseInputData';
import { getParquetFilePath } from '../input/parquetFormat';
import { writeOpossumParquetFile } from '../input/writeParquetFile';
import { type OpossumOutputFile } from '../types/types';
import { getSaveFileArgs } from './getSaveFileArgs';

export interface SaveFileParams {
  projectId: string;
  inputFileChecksum?: string;
  opossumFilePath?: string;
  attributionFilePath?: string;
}

export async function saveFile(
  params: SaveFileParams,
  inputFileRaw: Uint8Array,
): Promise<void> {
  const { result } = await getSaveFileArgs();

  const outputFileContent: OpossumOutputFile = {
    metadata: {
      projectId: params.projectId,
      fileCreationDate: String(Date.now()),
      inputFileMD5Checksum: params.inputFileChecksum,
    },
    manualAttributions: serializeAttributions(result.manualAttributions),
    resourcesToAttributions: result.resourcesToAttributions,
    resolvedExternalAttributions: Array.from(
      result.resolvedExternalAttributions,
    ),
  };

  if (params.opossumFilePath) {
    const tJsonStart = performance.now();
    await writeOpossumFile({
      path: params.opossumFilePath,
      input: inputFileRaw,
      output: outputFileContent,
    });
    const msJson = performance.now() - tJsonStart;
    console.log(`[parquet-bench] JSON save total=${msJson.toFixed(1)}ms`);

    try {
      const tParqStart = performance.now();
      const timings = await writeOpossumParquetFile({
        archivePath: getParquetFilePath(params.opossumFilePath),
        projectId: params.projectId,
        outputFile: outputFileContent,
      });
      const msParq = performance.now() - tParqStart;
      console.log(
        `[parquet-bench] Parquet save total=${msParq.toFixed(1)}ms ` +
          `(reported=${timings.msTotal.toFixed(1)}ms), ` +
          `size=${timings.archiveBytes} bytes`,
        timings.msPerTable,
      );
    } catch (err) {
      console.error('[parquet-bench] error during parquet save:', err);
    }
  } else if (params.attributionFilePath) {
    await writeFile({
      path: params.attributionFilePath,
      content: outputFileContent,
    });
  } else {
    throw new Error('No output file path configured');
  }
}
