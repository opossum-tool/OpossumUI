// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';

import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { writeOutputFileAsParquetDir } from '../db/experimentParquetSave';
import { serializeAttributions } from '../input/parseInputData';
import { type OpossumOutputFile } from '../types/types';
import { getSaveFileArgs } from './getSaveFileArgs';

const EXPERIMENT_WRITE_PARQUET = true;

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

  console.log(
    `[save] manualAttributions=${Object.keys(outputFileContent.manualAttributions).length} ` +
      `resourcesToAttributions=${Object.keys(outputFileContent.resourcesToAttributions).length} ` +
      `resolvedExternalAttributions=${outputFileContent.resolvedExternalAttributions.length}`,
  );

  if (EXPERIMENT_WRITE_PARQUET && params.opossumFilePath) {
    const parquetDir = `${params.opossumFilePath}.parquet`;
    const start = performance.now();
    await writeOutputFileAsParquetDir({
      outputFile: outputFileContent,
      parquetDir,
    });
    const ms = (performance.now() - start).toFixed(1);
    const size = directorySize(parquetDir);
    console.log(`[save] parquet dir: ${ms} ms, ${formatBytes(size)}`);
  }

  if (params.opossumFilePath) {
    const start = performance.now();
    await writeOpossumFile({
      path: params.opossumFilePath,
      input: inputFileRaw,
      output: outputFileContent,
    });
    const ms = (performance.now() - start).toFixed(1);
    const size = fs.statSync(params.opossumFilePath).size;
    console.log(
      `[save] opossum file: ${ms} ms, ${formatBytes(size)} (${params.opossumFilePath})`,
    );
  } else if (params.attributionFilePath) {
    await writeFile({
      path: params.attributionFilePath,
      content: outputFileContent,
    });
  } else {
    throw new Error('No output file path configured');
  }
}

function directorySize(dir: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      total += directorySize(full);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[unit]}`;
}
