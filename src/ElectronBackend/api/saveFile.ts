// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
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
