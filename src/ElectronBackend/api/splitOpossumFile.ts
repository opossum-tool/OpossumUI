// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { getReadonlyRules, replaceReadonlyRules } from '../db/split-info';
import {
  splitOpossumArchive,
  validateSelectedFolderPaths,
} from '../split/split-opossum-file';
import { saveFile, type SaveFileParams } from './saveFile';

/**
 * Input for splitting the current .opossum archive into a separate partition.
 *
 * The original archive is saved to `opossumFilePath` before the partition is
 * created at `partitionOutputPath`. The paths must therefore refer to separate
 * files.
 */
export interface SplitOpossumFileParams {
  /** Parameters used to save the updated source .opossum archive. */
  saveFileParams: Omit<SaveFileParams, 'opossumFilePath'> & {
    opossumFilePath: string;
  };
  /** Resource paths to include in the new partition archive. */
  selectedFolderPaths: Array<string>;
  /** Path at which to create the partition .opossum archive. */
  partitionOutputPath: string;
}

/**
 * Splits the current opossum file into two collaborative partitions.
 * The selected resources will become readonly in the current file and a new opossum file will be created where everything else will be readonly.
 */
export async function splitOpossumFile(
  {
    saveFileParams,
    selectedFolderPaths,
    partitionOutputPath,
  }: SplitOpossumFileParams,
  opossumZip: AdmZip,
): Promise<void> {
  await saveFile(saveFileParams, opossumZip);
  const currentReadonlyRules = await getReadonlyRules();
  await validateSelectedFolderPaths(selectedFolderPaths, currentReadonlyRules);
  const result = await splitOpossumArchive({
    paths: {
      opossumFilePath: saveFileParams.opossumFilePath,
      selectedFolderPaths,
      partitionOutputPath,
    },
    sourceZip: opossumZip,
    readonlyRules: currentReadonlyRules,
  });
  await replaceReadonlyRules(result.sourceReadonlyRules);
}
