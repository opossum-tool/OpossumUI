// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { writeOpossumFile } from '../../shared/write-file';
import { serializeAttributions } from '../input/parseInputData';
import type { OpossumOutputFile } from '../types/types';
import { getSaveFileArgs } from './getSaveFileArgs';

export async function buildOpossumOutputFile(
  projectId: string,
): Promise<OpossumOutputFile> {
  const { result } = await getSaveFileArgs();

  return {
    metadata: {
      projectId,
      fileCreationDate: String(Date.now()),
      // Previously held an MD5 checksum of the raw input file (legacy JSON
      // path). No longer computed since all files go through the opossum path.
      inputFileMD5Checksum: undefined,
    },
    manualAttributions: serializeAttributions(result.manualAttributions),
    resourcesToAttributions: result.resourcesToAttributions,
    resolvedExternalAttributions: Array.from(
      result.resolvedExternalAttributions,
    ),
  };
}

export async function persistOutputFile(
  projectId: string,
  opossumFilePath: string,
  opossumZip: AdmZip,
): Promise<void> {
  const outputFileContent = await buildOpossumOutputFile(projectId);

  writeOpossumFile({
    path: opossumFilePath,
    zip: opossumZip,
    output: outputFileContent,
  });
}
