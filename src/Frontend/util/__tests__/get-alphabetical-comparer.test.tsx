// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../get-alphabetical-comparer';

describe('getAlphabeticalComparer', () => {
  test('sorts alphabetically by list card title', () => {
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
      getAlphabeticalComparer(testAttributions)
    );

    expect(sortedAttributionIds).toEqual(['3', '5', '4', '2', '1']);
  });

  test('sorts empty attributions to the end of the list', () => {
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
      getAlphabeticalComparer(testAttributions)
    );

    expect(sortedAttributionIds).toEqual(['2', '3', '1']);
  });

  test('sorts non-alphabetical chars behind alphabetical chars', () => {
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
      getAlphabeticalComparer(testAttributions)
    );

    expect(sortedAttributionIds).toEqual(['2', '1', '3']);
  });
});
