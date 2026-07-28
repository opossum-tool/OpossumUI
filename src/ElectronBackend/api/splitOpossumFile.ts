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

export interface SplitOpossumFileParams {
  saveFileParams: Omit<SaveFileParams, 'opossumFilePath'> & {
    opossumFilePath: string;
  };
  selectedFolderPaths: Array<string>;
  partitionOutputPath: string;
}

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
