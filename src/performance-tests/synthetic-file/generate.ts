// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  getSyntheticFileProfile,
  SYNTHETIC_FILE_PROFILE_NAMES,
} from './profiles';
import { getSyntheticFilePath, writeSyntheticOpossumFile } from './writer';

async function main(): Promise<void> {
  for (const profileName of SYNTHETIC_FILE_PROFILE_NAMES) {
    const profile = getSyntheticFileProfile(profileName);
    const outputPath = getSyntheticFilePath(profile);
    console.log(`Generating ${profile.name} synthetic file at ${outputPath}`);
    await writeSyntheticOpossumFile({ outputPath, profile });
    console.log(`Wrote ${outputPath}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
