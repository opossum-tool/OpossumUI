// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { faker } from '../../../testing/Faker';
import { sortAttributions } from '../sort-attributions';

describe('sortAttributions', () => {
  it('sorts alphabetically by card label', () => {
    const attributions = [
      faker.opossum.packageInfo({
        packageName: 'zz Test package',
        id: 'a',
      }),
      faker.opossum.packageInfo({
        attributionConfidence: 0,
        comment: 'Some comment',
        packageName: 'Test package',
        packageVersion: '1.0',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
        id: 'b',
      }),
      faker.opossum.packageInfo({
        packageName: undefined,
        comment: 'Example comment',
        id: 'c',
      }),
      faker.opossum.packageInfo({
        packageName: 'JQuery',
        packageVersion: '1.0',
        id: 'd',
      }),
      faker.opossum.packageInfo({
        attributionConfidence: 0,
        packageName: 'JQuery',
        packageVersion: undefined,
        licenseText: 'Some license text',
        id: 'e',
      }),
    ];
    const sorted = sortAttributions({
      attributions,
      sorting: text.sortings.name,
    });

    expect(Object.keys(sorted)).toEqual(['c', 'd', 'e', 'b', 'a']);
  });

  it('sorts by criticality', () => {
    const attributions = [
      faker.opossum.packageInfo({
        packageName: 'Test package 1',
        packageVersion: '1.0',
        id: 'a',
      }),
      faker.opossum.packageInfo({
        criticality: Criticality.Medium,
        id: 'b',
      }),
      faker.opossum.packageInfo({
        criticality: Criticality.High,
        id: 'c',
      }),
      faker.opossum.packageInfo({
        packageName: 'Test package 2',
        id: 'd',
      }),
    ];
    const sorted = sortAttributions({
      attributions,
      sorting: text.sortings.criticality,
    });

    expect(Object.keys(sorted)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('sorts by occurrence', () => {
    const attributions = [
      faker.opossum.packageInfo({
        packageName: 'Test package 1',
        packageVersion: '1.0',
        id: 'a',
      }),
      faker.opossum.packageInfo({
        count: 2,
        id: 'b',
      }),
      faker.opossum.packageInfo({
        count: 3,
        id: 'c',
      }),
      faker.opossum.packageInfo({
        packageName: 'Test package 2',
        id: 'd',
      }),
    ];
    const sorted = sortAttributions({
      attributions,
      sorting: text.sortings.occurrence,
    });

    expect(Object.keys(sorted)).toEqual(['c', 'b', 'a', 'd']);
  });
});
