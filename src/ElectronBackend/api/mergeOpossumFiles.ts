// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { mergeOpossumArchives } from '../split/merge-opossum-files';
import { saveFile, type SaveFileParams } from './saveFile';

export interface MergeOpossumFilesParams {
  saveFileParams: Omit<SaveFileParams, 'opossumFilePath'> & {
    opossumFilePath: string;
  };
  partitionPaths: Array<string>;
}

export interface MergeOpossumFilesFromPathsParams {
  inputPaths: Array<string>;
  outputPath: string;
}

export async function mergeOpossumFilesFromPaths({
  inputPaths,
  outputPath,
}: MergeOpossumFilesFromPathsParams): Promise<void> {
  await mergeOpossumArchives({ inputPaths, outputPath });
}

export async function mergeOpossumFiles(
  { saveFileParams, partitionPaths }: MergeOpossumFilesParams,
  opossumZip: AdmZip,
): Promise<void> {
  await saveFile(saveFileParams, opossumZip);
  await mergeOpossumArchives({
    inputPaths: [saveFileParams.opossumFilePath, ...partitionPaths],
    outputPath: saveFileParams.opossumFilePath,
  });
}
