// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import {
  MergeOpossumFilesErrorType,
  type MergeOpossumFilesResult,
} from '../../shared/shared-types';
import {
  mergeOpossumArchives,
  ReadonlyResourceOutputConflictError,
} from '../split/merge-opossum-files';
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
}: MergeOpossumFilesFromPathsParams): Promise<MergeOpossumFilesResult> {
  try {
    await mergeOpossumArchives({
      ignoreReadonlyResourceOutputConflicts,
      inputPaths,
      outputPath,
    });
    return { status: 'success' };
  } catch (error) {
    return getMergeOpossumFilesErrorResult(error);
  }
}

export async function mergeOpossumFiles(
  {
    ignoreReadonlyResourceOutputConflicts,
    saveFileParams,
    partitionPaths,
  }: MergeOpossumFilesParams,
  opossumZip: AdmZip,
): Promise<MergeOpossumFilesResult> {
  try {
    await saveFile(saveFileParams, opossumZip);
    await mergeOpossumArchives({
      ignoreReadonlyResourceOutputConflicts,
      inputPaths: [saveFileParams.opossumFilePath, ...partitionPaths],
      outputPath: saveFileParams.opossumFilePath,
    });
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
