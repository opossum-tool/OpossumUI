// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import { refreshReadonlyData } from '../db/refresh-readonly-data';
import { replaceReadonlyRules } from '../db/split-info';
import { saveFile, type SaveFileParams } from './saveFile';

/** Removes all split read-only rules from the current archive. */
export async function forceUnlockOpossumFile(
  params: SaveFileParams,
  opossumZip: AdmZip,
): Promise<void> {
  await replaceReadonlyRules([]);
  await refreshReadonlyData();
  await saveFile(params, opossumZip);
}
