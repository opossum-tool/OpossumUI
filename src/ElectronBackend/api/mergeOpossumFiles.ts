// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { mergeOpossumArchives } from '../split/merge-opossum-files';
import { saveFile, type SaveFileParams } from './saveFile';

export interface MergeOpossumFilesParams {
  ignoreReadonlyResourceOutputConflicts: boolean;
  saveFileParams: SaveFileParams;
  partitionPaths: Array<string>;
}

export interface MergeOpossumFilesFromPathsParams {
  ignoreReadonlyResourceOutputConflicts: boolean;
  inputPaths: Array<string>;
  outputPath: string;
}

export async function mergeOpossumFilesFromPaths({
  ignoreReadonlyResourceOutputConflicts,
  inputPaths,
  outputPath,
}: MergeOpossumFilesFromPathsParams): Promise<void> {
  await mergeOpossumArchives({
    ignoreReadonlyResourceOutputConflicts,
    inputPaths,
    outputPath,
  });
}

export async function mergeOpossumFiles(
  {
    ignoreReadonlyResourceOutputConflicts,
    saveFileParams,
    partitionPaths,
  }: MergeOpossumFilesParams,
  opossumZip: AdmZip,
): Promise<void> {
  await saveFile(saveFileParams, opossumZip);
  await mergeOpossumArchives({
    ignoreReadonlyResourceOutputConflicts,
    inputPaths: [saveFileParams.opossumFilePath, ...partitionPaths],
    outputPath: saveFileParams.opossumFilePath,
  });
}
