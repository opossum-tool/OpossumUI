// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { writeOpossumFile } from '../../shared/write-file';
import { getReadonlyRules, replaceReadonlyRules } from '../db/split-info';
import {
  splitOpossumArchive,
  validateSelectedFolderPaths,
} from '../split/split-opossum-file';
import { buildOpossumOutputFile } from './buildOpossumOutputFile';

export interface SplitOpossumFileParams {
  projectId: string;
  opossumFilePath: string;
  selectedFolderPaths: Array<string>;
  partitionOutputPath: string;
}

export async function splitOpossumFile(
  {
    projectId,
    opossumFilePath,
    selectedFolderPaths,
    partitionOutputPath,
  }: SplitOpossumFileParams,
  opossumZip: AdmZip,
): Promise<void> {
  const output = await buildOpossumOutputFile(projectId);
  await writeOpossumFile({
    path: opossumFilePath,
    zip: opossumZip,
    output,
    readonlyRules: await getReadonlyRules(),
  });
  const currentReadonlyRules = await getReadonlyRules();
  await validateSelectedFolderPaths(selectedFolderPaths, currentReadonlyRules);
  const result = await splitOpossumArchive({
    paths: {
      opossumFilePath,
      selectedFolderPaths,
      partitionOutputPath,
    },
    sourceZip: opossumZip,
    readonlyRules: currentReadonlyRules,
  });
  await replaceReadonlyRules(result.sourceReadonlyRules);
}
