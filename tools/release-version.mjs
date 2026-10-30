// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

// Windows file versions store each numeric component as an unsigned 16-bit integer.
export const MAX_REVISION = 65535;

export function versionParts(tag, warn) {
  const match = /^OpossumUI-(\d{4})-(\d{2})-(\d{2})(?:\.(\d{1,5}))?$/.exec(tag);
  if (!match) {
    warn?.(`Skipping invalid historical release tag: ${tag}`);
    return null;
  }
  const [, year, month, day, revision = '0'] = match;
  const date = `${year}-${month}-${day}`;
  const dateLength = 'YYYY-MM-DD'.length;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, dateLength) !== date ||
    Number(revision) > MAX_REVISION
  ) {
    warn?.(`Skipping invalid historical release tag: ${tag}`);
    return null;
  }
  return [Number(year), Number(month) * 100 + Number(day), Number(revision)];
}

export function compareVersions(left, right) {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function assertNewerThanPublished(tag, releases, warn) {
  const version = versionParts(tag);
  if (!version) {
    throw new Error(`Invalid release tag: ${tag}`);
  }
  for (const release of releases.filter((item) => !item.draft)) {
    const previous = versionParts(release.tag_name, warn);
    if (previous && compareVersions(previous, version) >= 0) {
      throw new Error(`Release ${tag} must be newer than ${release.tag_name}`);
    }
  }
}
