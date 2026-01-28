// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { validateSpdxExpression } from '../validate-spdx';

describe('validateSpdxExpression', () => {
  const knownLicenseIds = new Set([
    'MIT',
    'Apache-2.0',
    'GPL-2.0-only',
    'GPL-3.0-or-later',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'Classpath-exception-2.0',
  ]);

  it.each([
    ['empty string', ''],
    ['simple license', 'MIT'],
    ['license with version', 'Apache-2.0'],
    ['compound AND', 'MIT AND Apache-2.0'],
    ['compound OR', 'MIT OR Apache-2.0'],
    ['WITH clause', 'GPL-2.0-only WITH Classpath-exception-2.0'],
    ['parentheses', '(MIT OR Apache-2.0) AND BSD-3-Clause'],
    ['nested parentheses', '((MIT OR Apache-2.0) AND BSD-3-Clause)'],
    ['extra whitespace', 'MIT  AND  Apache-2.0'],
    ['LicenseRef', 'LicenseRef-MyLicense'],
    ['DocumentRef', 'DocumentRef-ext:LicenseRef-MyLicense'],
  ])('returns valid for %s', (_, spdxExpression) => {
    expect(validateSpdxExpression({ spdxExpression, knownLicenseIds })).toEqual(
      {
        type: 'valid',
      },
    );
  });

  it.each([
    ['unbalanced opening parenthesis', '(MIT'],
    ['unbalanced closing parenthesis', 'MIT)'],
    ['incomplete AND', 'MIT AND'],
    ['incomplete OR', 'MIT OR'],
    ['empty parentheses', '()'],
  ])('returns syntax-error for %s', (_, spdxExpression) => {
    expect(validateSpdxExpression({ spdxExpression, knownLicenseIds })).toEqual(
      {
        type: 'syntax-error',
      },
    );
  });

  it.each([
    ['lowercase and', 'MIT and Apache-2.0', 'MIT AND Apache-2.0'],
    ['lowercase or', 'MIT or Apache-2.0', 'MIT OR Apache-2.0'],
    [
      'lowercase with',
      'GPL-2.0-only with Classpath-exception-2.0',
      'GPL-2.0-only WITH Classpath-exception-2.0',
    ],
    ['mixed case And', 'MIT And Apache-2.0', 'MIT AND Apache-2.0'],
    ['mixed case Or', 'MIT Or Apache-2.0', 'MIT OR Apache-2.0'],
    [
      'multiple conjunctions',
      'MIT or Apache-2.0 and BSD-3-Clause',
      'MIT OR Apache-2.0 AND BSD-3-Clause',
    ],
  ])('fixes %s', (_, spdxExpression, expectedFix) => {
    expect(validateSpdxExpression({ spdxExpression, knownLicenseIds })).toEqual(
      {
        type: 'uncapitalized-conjunctions',
        fix: expectedFix,
      },
    );
  });

  it.each([
    [
      'unknown license without suggestion',
      'CompletelyUnknownLicense',
      {
        unknownId: 'CompletelyUnknownLicense',
        suggestion: undefined,
        fix: undefined,
      },
    ],
    [
      'lowercase mit -> MIT',
      'mit',
      { unknownId: 'mit', suggestion: 'MIT', fix: 'MIT' },
    ],
    [
      'unknown in compound expression',
      'mit AND Apache-2.0',
      { unknownId: 'mit', suggestion: 'MIT', fix: 'MIT AND Apache-2.0' },
    ],
    [
      'LicenseRef with incorrect casing',
      'licenseref-MyLicense',
      {
        unknownId: 'licenseref-MyLicense',
        suggestion: 'LicenseRef-MyLicense',
        fix: 'LicenseRef-MyLicense',
      },
    ],
    [
      'LicenseRef with space',
      'LicenseRef MyLicense',
      {
        unknownId: 'LicenseRef MyLicense',
        suggestion: 'LicenseRef-MyLicense',
        fix: 'LicenseRef-MyLicense',
      },
    ],
    [
      'DocumentRef with incorrect casing',
      'documentref-ext',
      {
        unknownId: 'documentref-ext',
        suggestion: 'DocumentRef-ext',
        fix: 'DocumentRef-ext',
      },
    ],
  ])('detects %s', (_, spdxExpression, expectedUnknown) => {
    expect(validateSpdxExpression({ spdxExpression, knownLicenseIds })).toEqual(
      {
        type: 'unknown-licenses',
        unknownLicenseIds: [expectedUnknown],
      },
    );
  });

  it('detects multiple unknown licenses', () => {
    const result = validateSpdxExpression({
      spdxExpression: 'Unknown1 AND Unknown2',
      knownLicenseIds,
    });

    expect(result).toEqual({
      type: 'unknown-licenses',
      unknownLicenseIds: expect.arrayContaining([
        expect.objectContaining({ unknownId: 'Unknown1' }),
        expect.objectContaining({ unknownId: 'Unknown2' }),
      ]),
    });
  });

  it('does not match conjunctions embedded in license names', () => {
    const extendedKnownIds = new Set([...knownLicenseIds, 'ANDERSON']);
    expect(
      validateSpdxExpression({
        spdxExpression: 'ANDERSON',
        knownLicenseIds: extendedKnownIds,
      }),
    ).toEqual({
      type: 'valid',
    });
  });

  it('prioritizes conjunction errors over unknown license errors', () => {
    const result = validateSpdxExpression({
      spdxExpression: 'mit and apache',
      knownLicenseIds,
    });
    expect(result.type).toBe('uncapitalized-conjunctions');
  });
});
