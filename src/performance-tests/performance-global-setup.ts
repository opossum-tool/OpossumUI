// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getSyntheticFileProfile } from './synthetic-file/profiles';
import {
  getSyntheticFilePath,
  writeSyntheticOpossumFile,
} from './synthetic-file/writer';

export default async function globalSetup(): Promise<void> {
  const profile = getSyntheticFileProfile(
    process.env.PERFORMANCE_PROFILE ?? 'small',
  );
  const outputPath = getSyntheticFilePath(profile);
  console.log(`Generating ${profile.name} synthetic file at ${outputPath}`);
  await writeSyntheticOpossumFile({ outputPath, profile });
}
