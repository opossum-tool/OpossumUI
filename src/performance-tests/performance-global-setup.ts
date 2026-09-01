// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs/promises';
import path from 'node:path';

import { getSyntheticFileProfile } from './synthetic-file/profiles';
import {
  getSyntheticFilePath,
  writeSyntheticOpossumFile,
} from './synthetic-file/writer';

const PERFORMANCE_CURRENT_ARTIFACTS_DIRECTORY = path.resolve(
  __dirname,
  '..',
  '..',
  'performance-artifacts',
  'current',
);

export default async function globalSetup(): Promise<void> {
  await fs.rm(PERFORMANCE_CURRENT_ARTIFACTS_DIRECTORY, {
    recursive: true,
    force: true,
  });
  const profile = getSyntheticFileProfile(
    process.env.PERFORMANCE_PROFILE ?? 'small',
  );
  const outputPath = getSyntheticFilePath(profile);
  console.log(`Generating ${profile.name} synthetic file at ${outputPath}`);
  await writeSyntheticOpossumFile({ outputPath, profile });
}
