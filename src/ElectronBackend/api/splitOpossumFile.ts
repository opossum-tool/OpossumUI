// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { refreshReadonlyDataAfterSplit } from '../db/initializeDb';
import { getReadonlyRules, replaceReadonlyRules } from '../db/split-info';
import {
  splitOpossumArchive,
  validateSelectedFolderPaths,
} from '../split/split-opossum-file';
import { saveFile, type SaveFileParams } from './saveFile';

/**
 * Input for splitting the current .opossum archive.
 *
 * The original archive is saved to `opossumFilePath` before the partition is
 * created at `splitOpossumFilePath`. The paths must therefore refer to separate
 * files.
 */
export interface SplitOpossumFileParams {
  saveFileParams: Omit<SaveFileParams, 'opossumFilePath'> & {
    opossumFilePath: string;
  };
  selectedFolderPaths: Array<string>;
  /** Path at which to create the new .opossum archive. */
  splitOpossumFilePath: string;
}

export async function splitOpossumFile(
  {
    saveFileParams,
    selectedFolderPaths,
    splitOpossumFilePath,
  }: SplitOpossumFileParams,
  opossumZip: AdmZip,
): Promise<void> {
  await saveFile(saveFileParams, opossumZip);
  const currentReadonlyRules = await getReadonlyRules();
  await validateSelectedFolderPaths(selectedFolderPaths, currentReadonlyRules);
  const result = await splitOpossumArchive({
    paths: {
      sourceOpossumFilePath: saveFileParams.opossumFilePath,
      selectedFolderPaths,
      splitOpossumFilePath,
    },
    sourceZip: opossumZip,
    readonlyRules: currentReadonlyRules,
  });
  await replaceReadonlyRules(result.sourceReadonlyRules);
  await refreshReadonlyDataAfterSplit();
}
