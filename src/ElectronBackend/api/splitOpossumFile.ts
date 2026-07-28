// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { getDb } from '../db/db';
import { getReadonlyRules, replaceReadonlyRules } from '../db/split-info';
import {
  splitOpossumArchive,
  validateSelectedFolderPaths,
} from '../split/split-opossum-file';
import { saveFile, type SaveFileParams } from './saveFile';

export interface SplitOpossumFileParams extends SaveFileParams {
  opossumFilePath: string;
  selectedFolderPaths: Array<string>;
  partitionOutputPath: string;
}

export async function splitOpossumFile(
  {
    selectedFolderPaths,
    partitionOutputPath,
    ...saveFileParams
  }: SplitOpossumFileParams,
  opossumZip: AdmZip,
): Promise<void> {
  await saveFile(saveFileParams, opossumZip);
  const currentReadonlyRules = await getReadonlyRules();
  const normalizedSelectedFolderPaths = validateSelectedFolderPaths(
    selectedFolderPaths,
    currentReadonlyRules,
  );
  const selectedResources = await getDb()
    .selectFrom('resource')
    .select('path')
    .where('path', 'in', normalizedSelectedFolderPaths)
    .execute();
  const selectedResourcePathsInDatabase = new Set(
    selectedResources.map((resource) => resource.path),
  );
  for (const selectedFolderPath of normalizedSelectedFolderPaths) {
    if (!selectedResourcePathsInDatabase.has(selectedFolderPath)) {
      throw new Error(
        `Selected resource '${selectedFolderPath}' does not exist`,
      );
    }
  }
  const result = await splitOpossumArchive({
    opossumFilePath: saveFileParams.opossumFilePath,
    selectedFolderPaths: normalizedSelectedFolderPaths,
    partitionOutputPath,
    sourceZip: opossumZip,
    readonlyRules: currentReadonlyRules,
  });
  await replaceReadonlyRules(result.complementReadonlyRules);
}
