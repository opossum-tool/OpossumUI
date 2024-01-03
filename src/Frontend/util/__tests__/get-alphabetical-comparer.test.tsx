// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions, Criticality } from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import {
  compareAlphabeticalStrings,
  getAlphabeticalComparerForAttributions,
} from '../get-alphabetical-comparer';

describe('getAlphabeticalComparerForAttributions', () => {
  it('sorts alphabetically by list card title', () => {
    const testAttributions: Attributions = {
      '1': {
        packageName: 'zz Test package',
      },
      '2': {
        attributionConfidence: 0,
        comment: 'Some comment',
        packageName: 'Test package',
        packageVersion: '1.0',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
      },
      '3': {
        comment: 'Example comment',
      },
      '4': {
        packageName: 'JQuery',
        packageVersion: '1.0',
      },
      '5': {
        attributionConfidence: 0,
        packageName: 'JQuery',
        licenseText: 'Some license text',
      },
    };
    const sortedAttributionIds = Object.keys(testAttributions).sort(
      getAlphabeticalComparerForAttributions(testAttributions, false),
    );

    expect(sortedAttributionIds).toEqual(['3', '5', '4', '2', '1']);
  });

  it('sorts empty attributions to the end of the list', () => {
    const testAttributions: Attributions = {
      '1': {},
      '2': {
        attributionConfidence: 0,
        comment: 'Some comment',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
      },
      '3': {
        copyright: '(C) Copyright John Doe',
      },
    };
    const sortedAttributionIds = Object.keys(testAttributions).sort(
      getAlphabeticalComparerForAttributions(testAttributions, false),
    );

    expect(sortedAttributionIds).toEqual(['2', '3', '1']);
  });

  it('sorts non-alphabetical chars behind alphabetical chars', () => {
    const testAttributions: Attributions = {
      '1': {
        packageName: 'Test package',
        packageVersion: '1.0',
      },
      '2': {
        attributionConfidence: 0,
        comment: 'Some comment',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
      },
      '3': {
        copyright: 'John Doe',
      },
    };
    const sortedAttributionIds = Object.keys(testAttributions).sort(
      getAlphabeticalComparerForAttributions(testAttributions, false),
    );

    expect(sortedAttributionIds).toEqual(['2', '1', '3']);
  });

  it('sorts by criticality', () => {
    const testAttributions: Attributions = {
      '1': faker.opossum.manualPackageInfo({
        packageName: 'Test package 1',
        packageVersion: '1.0',
      }),
      '2': faker.opossum.manualPackageInfo({
        attributionConfidence: 0,
        comment: 'Some comment',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
        criticality: Criticality.Medium,
      }),
      '3': faker.opossum.manualPackageInfo({
        copyright: 'John Doe',
        criticality: Criticality.High,
      }),
      '4': faker.opossum.manualPackageInfo({
        packageName: 'Test package 2',
        copyright: 'John Doe',
      }),
    };
    const sortedAttributionIds = Object.keys(testAttributions).sort(
      getAlphabeticalComparerForAttributions(testAttributions, true),
    );

    expect(sortedAttributionIds).toEqual(['3', '2', '1', '4']);
  });
});

describe('compareAlphabeticalStrings', () => {
  it('sorts licenses alphabetically', () => {
    const testLicenses = [
      'MIT',
      '123',
      'the MIT',
      '  Mit  ',
      '_mit',
      'apache-2.0',
    ];
    const sortedLicenses = testLicenses.sort((a, b) =>
      compareAlphabeticalStrings(a, b),
    );
    const expectedSortedLicenses = [
      'apache-2.0',
      'MIT',
      '  Mit  ',
      'the MIT',
      '123',
      '_mit',
    ];

    expect(sortedLicenses).toEqual(expectedSortedLicenses);
  });
});
