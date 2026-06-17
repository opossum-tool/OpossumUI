// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { writeOpossumFile } from '../../shared/write-file';
import { serializeAttributions } from '../input/parseInputData';
import type { OpossumOutputFile } from '../types/types';
import { getSaveFileArgs } from './getSaveFileArgs';

export interface SaveFileParams {
  projectId: string;
  opossumFilePath: string;
}

export async function saveFile(
  params: SaveFileParams,
  opossumZip: AdmZip,
): Promise<void> {
  const { result } = await getSaveFileArgs();

  const outputFileContent: OpossumOutputFile = {
    metadata: {
      projectId: params.projectId,
      fileCreationDate: String(Date.now()),
    },
    manualAttributions: serializeAttributions(result.manualAttributions),
    resourcesToAttributions: result.resourcesToAttributions,
    resolvedExternalAttributions: Array.from(
      result.resolvedExternalAttributions,
    ),
  };

  writeOpossumFile({
    path: params.opossumFilePath,
    zip: opossumZip,
    output: outputFileContent,
  });
}
