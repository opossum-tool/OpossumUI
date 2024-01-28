// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions, Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { faker } from '../../../testing/Faker';
import {
  compareAlphabeticalStrings,
  getPackageSorter,
} from '../get-package-sorter';

describe('getPackageSorter', () => {
  it('sorts alphabetically by list card title', () => {
    const attributions: Attributions = {
      '1': {
        packageName: 'zz Test package',
        id: '1',
      },
      '2': {
        attributionConfidence: 0,
        comments: ['Some comment'],
        packageName: 'Test package',
        packageVersion: '1.0',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
        id: '2',
      },
      '3': {
        comments: ['Example comment'],
        id: '3',
      },
      '4': {
        packageName: 'JQuery',
        packageVersion: '1.0',
        id: '4',
      },
      '5': {
        attributionConfidence: 0,
        packageName: 'JQuery',
        licenseText: 'Some license text',
        id: '5',
      },
    };
    const sortedAttributionIds = Object.keys(attributions).sort(
      getPackageSorter(attributions, text.sortings.name),
    );

    expect(sortedAttributionIds).toEqual(['3', '5', '4', '2', '1']);
  });

  it('sorts empty attributions to the end of the list', () => {
    const attributions: Attributions = {
      '1': { id: '1' },
      '2': {
        attributionConfidence: 0,
        comments: ['Some comment'],
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
        id: '2',
      },
      '3': {
        copyright: '(C) Copyright John Doe',
        id: '3',
      },
    };
    const sortedAttributionIds = Object.keys(attributions).sort(
      getPackageSorter(attributions, text.sortings.name),
    );

    expect(sortedAttributionIds).toEqual(['2', '3', '1']);
  });

  it('sorts non-alphabetical chars behind alphabetical chars', () => {
    const attributions: Attributions = {
      '1': {
        packageName: 'Test package',
        packageVersion: '1.0',
        id: '1',
      },
      '2': {
        attributionConfidence: 0,
        comments: ['Some comment'],
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
        id: '2',
      },
      '3': {
        copyright: 'John Doe',
        id: '3',
      },
    };
    const sortedAttributionIds = Object.keys(attributions).sort(
      getPackageSorter(attributions, text.sortings.name),
    );

    expect(sortedAttributionIds).toEqual(['2', '1', '3']);
  });

  it('sorts by criticality', () => {
    const attributions: Attributions = {
      '1': faker.opossum.packageInfo({
        packageName: 'Test package 1',
        packageVersion: '1.0',
      }),
      '2': faker.opossum.packageInfo({
        criticality: Criticality.Medium,
      }),
      '3': faker.opossum.packageInfo({
        criticality: Criticality.High,
      }),
      '4': faker.opossum.packageInfo({
        packageName: 'Test package 2',
      }),
    };
    const sortedAttributionIds = Object.keys(attributions).sort(
      getPackageSorter(attributions, text.sortings.criticality),
    );

    expect(sortedAttributionIds).toEqual(['3', '2', '1', '4']);
  });

  it('sorts by occurrence', () => {
    const attributions: Attributions = {
      '1': faker.opossum.packageInfo({
        packageName: 'Test package 1',
        packageVersion: '1.0',
      }),
      '2': faker.opossum.packageInfo({
        count: 2,
      }),
      '3': faker.opossum.packageInfo({
        count: 3,
      }),
      '4': faker.opossum.packageInfo({
        packageName: 'Test package 2',
      }),
    };
    const sortedAttributionIds = Object.keys(attributions).sort(
      getPackageSorter(attributions, text.sortings.occurrence),
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
