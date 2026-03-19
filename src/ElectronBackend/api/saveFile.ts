// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { serializeAttributions } from '../input/parseInputData';
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
    await writeOpossumFile({
      path: params.opossumFilePath,
      input: inputFileRaw,
      output: outputFileContent,
    });
  } else if (params.attributionFilePath) {
    await writeFile({
      path: params.attributionFilePath,
      content: outputFileContent,
    });
  } else {
    throw new Error('No output file path configured');
  }
}
