// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { versionParts } from '../../../tools/release-version.mjs';
import {
  compareReleaseTags,
  formatReleaseTag,
  numericReleaseVersion,
  parseInstalledVersion,
  parseReleaseTag,
} from '../update-version';

describe('installed update versions', () => {
  it.each([
    ['2026.1023.0', 'OpossumUI-2026-10-23'],
    ['2026.1023.12', 'OpossumUI-2026-10-23.12'],
    ['2026.102.1', 'OpossumUI-2026-01-02.1'],
  ])('formats %s as %s', (version, tag) => {
    const parsed = parseInstalledVersion(version)!;

    expect(formatReleaseTag(parsed)).toBe(tag);
    expect(parseReleaseTag(tag)).toEqual(parsed);
    expect(numericReleaseVersion(parsed)).toBe(version);
  });

  it.each([
    '0.1.0',
    '0.0.0',
    'unknown',
    'local',
    '2026.1023.0-dev',
    'OpossumUI-2026-10-23',
    '2026.230.0',
    '2026.1023.65536',
    '2026.0102.0',
    '2026.1023.01',
    '2026.1301.0',
  ])('rejects %s', (value) => {
    expect(parseInstalledVersion(value)).toBeUndefined();
  });
  it.each([
    'OpossumUI-2026-02-30',
    'OpossumUI-2026-10-23.65536',
    'OpossumUI-2026-00-01',
    'OpossumUI-2026-10-23-beta',
    'abc123',
  ])('rejects release %s', (tag) => {
    expect(parseReleaseTag(tag)).toBeUndefined();
  });
  it('uses the same numeric contract as release packaging', () => {
    const tag = parseReleaseTag('OpossumUI-2026-10-23.12')!;
    expect(numericReleaseVersion(tag)).toBe('2026.1023.12');
    expect(numericReleaseVersion(tag)).toBe(
      versionParts('OpossumUI-2026-10-23.12')!.join('.'),
    );

    expect(parseInstalledVersion('2026.1023.12')).toEqual(tag);
    expect(
      compareReleaseTags(tag, parseInstalledVersion('2026.1023.2')!),
    ).toBeGreaterThan(0);
    expect(
      compareReleaseTags(parseReleaseTag('OpossumUI-2027-01-01')!, tag),
    ).toBeGreaterThan(0);
  });
});
