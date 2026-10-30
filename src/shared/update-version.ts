// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const MIN_YEAR = 1000;
const DATE_FACTOR = 100;
const MAX_REVISION = 65535;

export interface ReleaseVersion {
  year: number;
  month: number;
  day: number;
  revision: number;
}

export function parseReleaseTag(tag: string): ReleaseVersion | undefined {
  const match = /^OpossumUI-(\d{4})-(\d{2})-(\d{2})(?:\.(\d{1,5}))?$/.exec(tag);
  if (!match) {
    return undefined;
  }
  const [, y, m, d, r = '0'] = match;
  const [year, month, day, revision] = [y, m, d, r].map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    year < MIN_YEAR ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    revision > MAX_REVISION
  ) {
    return undefined;
  }
  return { year, month, day, revision };
}

export function numericReleaseVersion(version: ReleaseVersion): string {
  return `${version.year}.${version.month * DATE_FACTOR + version.day}.${version.revision}`;
}

export function formatReleaseTag({
  year,
  month,
  day,
  revision,
}: ReleaseVersion): string {
  const tag = `OpossumUI-${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return revision ? `${tag}.${revision}` : tag;
}

export function parseInstalledVersion(
  version: string,
): ReleaseVersion | undefined {
  const match = /^(\d{4})\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match) {
    return undefined;
  }
  const [, year, date, revision] = match;
  const month = Math.floor(Number(date) / DATE_FACTOR);
  const day = Number(date) % DATE_FACTOR;
  return parseReleaseTag(
    formatReleaseTag({
      year: Number(year),
      month,
      day,
      revision: Number(revision),
    }),
  );
}

export function compareReleaseTags(
  left: ReleaseVersion,
  right: ReleaseVersion,
): number {
  return (
    left.year - right.year ||
    left.month - right.month ||
    left.day - right.day ||
    left.revision - right.revision
  );
}
