// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../get-alphabetical-comparer';

describe('getAlphabeticalComparer', () => {
  test('sorts alphabetically', () => {
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
        copyright: '(C) Copyright John Doe',
      },
    };
    const sortedAttributionIds = Object.keys(testAttributions).sort(
      getAlphabeticalComparer(testAttributions)
    );

    expect(sortedAttributionIds).toEqual(['2', '1', '3']);
  });
});
