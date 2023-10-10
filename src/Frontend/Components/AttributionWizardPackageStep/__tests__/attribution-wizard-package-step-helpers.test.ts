// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ListWithAttributesItem } from '../../../types/types';
import { sortAttributedPackageItems } from '../attribution-wizard-package-step-helpers';

describe('sortAttributedPackageItems', () => {
  it('yields correct output', () => {
    const testAttributedPackageItems: Array<ListWithAttributesItem> = [
      { text: 'buffer', id: '1111', attributes: [{ text: '4 (40%)' }] },
      { text: 'boost', id: '22222', attributes: [{ text: '6 (60%)' }] },
      { text: 'numpy', id: '33333', manuallyAdded: true },
    ];
    const expectedSortedAttributedPackageItems: Array<ListWithAttributesItem> =
      [
        { text: 'numpy', id: '33333', manuallyAdded: true },
        { text: 'boost', id: '22222', attributes: [{ text: '6 (60%)' }] },
        { text: 'buffer', id: '1111', attributes: [{ text: '4 (40%)' }] },
      ];

    const testSortedAttributedPackageItems = sortAttributedPackageItems(
      testAttributedPackageItems,
    );

    expect(testSortedAttributedPackageItems).toEqual(
      expectedSortedAttributedPackageItems,
    );
  });
});
