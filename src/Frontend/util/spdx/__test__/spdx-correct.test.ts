// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { spdxCorrect } from '../spdx-correct';

describe('spdxCorrect', () => {
  it.each([
    ['MIT', 'MIT'],
    ['Apache-2.0', 'Apache-2.0'],
    ['GPL-3.0-or-later', 'GPL-3.0-or-later'],
  ])('returns valid identifiers unchanged: %s', (input, expected) => {
    expect(spdxCorrect(input)).toBe(expected);
  });

  it.each([
    ['mit', 'MIT'],
    ['apache-2.0', 'Apache-2.0'],
    ['MIT ', 'MIT'],
    ['M.I.T.', 'MIT'],
  ])('normalizes casing and formatting: %s -> %s', (input, expected) => {
    expect(spdxCorrect(input)).toBe(expected);
  });

  it.each([
    ['GNU General Public License', 'GPL-3.0-or-later'],
    ['gnu general public license', 'GPL-3.0-or-later'],
    ['GNU GENERAL PUBLIC LICENSE', 'GPL-3.0-or-later'],
    ['Mozilla Public License 2.0', 'MPL-2.0'],
    ['mozilla public license 2.0', 'MPL-2.0'],
  ])('handles case-insensitive transpositions: %s -> %s', (input, expected) => {
    expect(spdxCorrect(input)).toBe(expected);
  });

  it.each([
    ['Blue Oak 1.0.0', 'BlueOak-1.0.0'],
    ['Elastic License 2.0', 'Elastic-2.0'],
    ['Zero BSD', '0BSD'],
    ['0-Clause BSD', '0BSD'],
  ])('handles modern licenses: %s -> %s', (input, expected) => {
    expect(spdxCorrect(input)).toBe(expected);
  });

  it.each([
    ['Some Apache License', 'Apache-2.0'],
    ['My MIT License', 'MIT'],
    ['Custom Eclipse License', 'EPL-2.0'],
  ])('uses last resort matching: %s -> %s', (input, expected) => {
    expect(spdxCorrect(input)).toBe(expected);
  });

  it.each([
    ['GPL-2.0', 'GPL-2.0-only'],
    ['GPL-3.0', 'GPL-3.0-or-later'],
    ['LGPL-2.1', 'LGPL-2.1-only'],
    ['AGPL-3.0', 'AGPL-3.0-or-later'],
  ])('upgrades deprecated GPL identifiers: %s -> %s', (input, expected) => {
    expect(spdxCorrect(input)).toBe(expected);
  });

  it('returns null for unrecognizable input', () => {
    expect(spdxCorrect('xyzabc123')).toBeNull();
  });
});
