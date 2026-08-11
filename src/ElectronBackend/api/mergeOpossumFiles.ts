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
  reportProgress?: (message: string) => void;
}

export interface MergeOpossumFilesFromPathsParams {
  ignoreReadonlyResourceOutputConflicts: boolean;
  inputPaths: Array<string>;
  outputPath: string;
  reportProgress?: (message: string) => void;
}

export async function mergeOpossumFilesFromPaths({
  ignoreReadonlyResourceOutputConflicts,
  inputPaths,
  outputPath,
  reportProgress,
}: MergeOpossumFilesFromPathsParams): Promise<MergeOpossumFilesResult> {
  try {
    await mergeOpossumArchives({
      ignoreReadonlyResourceOutputConflicts,
      inputPaths,
      outputPath,
      reportProgress,
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
    reportProgress,
  }: MergeOpossumFilesParams,
  opossumZip: AdmZip,
): Promise<MergeOpossumFilesResult> {
  try {
    reportProgress?.('Saving current .opossum file');
    await saveFile(saveFileParams, opossumZip);
    await mergeOpossumArchives({
      ignoreReadonlyResourceOutputConflicts,
      inputPaths: [saveFileParams.opossumFilePath, ...partitionPaths],
      outputPath: saveFileParams.opossumFilePath,
      reportProgress,
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
