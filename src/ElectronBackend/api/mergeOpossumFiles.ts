// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import {
  MergeOpossumFilesErrorType,
  type MergeOpossumFilesResult,
  type ProgressCallback,
} from '../../shared/shared-types';
import {
  mergeOpossumArchives,
  ReadonlyResourceOutputConflictError,
} from '../split/merge-opossum-files';
import { saveFile, type SaveFileParams } from './saveFile';

export interface MergeOpossumFilesParams {
  saveFileParams: SaveFileParams;
  partitionPaths: Array<string>;
  ignoreReadonlyResourceOutputConflicts: boolean;
  deleteSplitFilesAfterMerge: boolean;
}

export interface MergeOpossumFilesFromPathsParams {
  inputPaths: Array<string>;
  outputPath: string;
  ignoreReadonlyResourceOutputConflicts: boolean;
  deleteSplitFilesAfterMerge: boolean;
}

export async function mergeOpossumFilesFromPaths(
  {
    inputPaths,
    outputPath,
    ignoreReadonlyResourceOutputConflicts,
    deleteSplitFilesAfterMerge,
  }: MergeOpossumFilesFromPathsParams,
  onProgress?: ProgressCallback,
): Promise<MergeOpossumFilesResult> {
  try {
    await mergeOpossumArchives(
      {
        inputPaths,
        outputPath,
        ignoreReadonlyResourceOutputConflicts,
        deleteSplitFilesAfterMerge,
      },
      onProgress,
    );
    return { status: 'success' };
  } catch (error) {
    return getMergeOpossumFilesErrorResult(error);
  }
}

export async function mergeOpossumFiles(
  {
    saveFileParams,
    partitionPaths,
    ignoreReadonlyResourceOutputConflicts,
    deleteSplitFilesAfterMerge,
  }: MergeOpossumFilesParams,
  opossumZip: AdmZip,
  onProgress?: ProgressCallback,
): Promise<MergeOpossumFilesResult> {
  try {
    onProgress?.('Saving current .opossum file');
    await saveFile(saveFileParams, opossumZip);
    await mergeOpossumArchives(
      {
        ignoreReadonlyResourceOutputConflicts,
        inputPaths: [saveFileParams.opossumFilePath, ...partitionPaths],
        outputPath: saveFileParams.opossumFilePath,
        deleteSplitFilesAfterMerge,
      },
      onProgress,
    );
    return { status: 'success' };
  } catch (error) {
    return getMergeOpossumFilesErrorResult(error);
  }
}

function getMergeOpossumFilesErrorResult(
  error: unknown,
): MergeOpossumFilesResult {
  if (error instanceof ReadonlyResourceOutputConflictError) {
    return {
      errorType: MergeOpossumFilesErrorType.ReadonlyResourceOutputConflict,
      status: 'error',
    };
  }
  return {
    errorMessage: error instanceof Error ? error.message : String(error),
    errorType: MergeOpossumFilesErrorType.Unknown,
    status: 'error',
  };
}
