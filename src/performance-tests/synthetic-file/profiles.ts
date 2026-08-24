// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export const SYNTHETIC_FILE_PROFILE_NAMES = ['small', 'large'] as const;
type SyntheticFileProfileName = (typeof SYNTHETIC_FILE_PROFILE_NAMES)[number];

export interface SyntheticFileProfile {
  readonly name: SyntheticFileProfileName;
  readonly seed: number;
  readonly resourceCount: number;
  readonly directoryCount: number;
  readonly externalAttributionCount: number;
  readonly manualAttributionCount: number;
  readonly externalLinkCount: number;
  readonly manualLinkCount: number;
  readonly breakpointCount: number;
  readonly packageCount: number;
  readonly deepDirectoryCount: number;
  readonly denseSignalCount: number;
  readonly bulkSignalCount: number;
  readonly highFanoutLinkCount: number;
  readonly splitDirectoryCountPerPartition: number;
}

const SMALL_PROFILE: SyntheticFileProfile = {
  name: 'small',
  seed: 0x51a7,
  resourceCount: 10000,
  directoryCount: 7500,
  externalAttributionCount: 100,
  manualAttributionCount: 50,
  externalLinkCount: 5000,
  manualLinkCount: 4500,
  breakpointCount: 4500,
  packageCount: 10,
  deepDirectoryCount: 12,
  denseSignalCount: 50,
  bulkSignalCount: 25,
  highFanoutLinkCount: 1000,
  splitDirectoryCountPerPartition: 2,
};

const LARGE_PROFILE: SyntheticFileProfile = {
  name: 'large',
  seed: 0x51a7,
  resourceCount: 2000000,
  directoryCount: 1500000,
  externalAttributionCount: 70000,
  manualAttributionCount: 70000,
  externalLinkCount: 1000000,
  manualLinkCount: 900000,
  breakpointCount: 900000,
  packageCount: 2000,
  deepDirectoryCount: 60,
  denseSignalCount: 5000,
  bulkSignalCount: 500,
  highFanoutLinkCount: 100000,
  splitDirectoryCountPerPartition: 20,
};

const SYNTHETIC_FILE_PROFILES: ReadonlyMap<string, SyntheticFileProfile> =
  new Map(
    [SMALL_PROFILE, LARGE_PROFILE].map((profile) => [profile.name, profile]),
  );

export function getSyntheticFileProfile(name: string): SyntheticFileProfile {
  const profile = SYNTHETIC_FILE_PROFILES.get(name);
  if (!profile) {
    throw new Error(`Unsupported synthetic file profile: ${name}`);
  }
  return profile;
}
