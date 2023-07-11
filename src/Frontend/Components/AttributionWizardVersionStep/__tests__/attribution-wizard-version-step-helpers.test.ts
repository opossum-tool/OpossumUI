// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ListWithAttributesItem } from '../../../types/types';
import { sortAttributedPackageVersions } from '../attribution-wizard-verstion-step-helpers';

describe('sortAttributedPackageVersions', () => {
  it('yields correct output', () => {
    const testAttributedPackageVersions: Array<ListWithAttributesItem> = [
      {
        text: '6.0',
        id: '1111',
        attributes: [{ text: 'buffer', id: '2222' }],
      },
      {
        text: '1.24.0',
        id: '3333',
        attributes: [{ text: 'numpy', id: '4444' }],
      },
      {
        text: '6.0.3',
        id: '5555',
        attributes: [{ text: 'buffer', id: '6666' }],
      },
      {
        text: '1.1.1',
        id: '7777',
        manuallyAdded: true,
      },
      {
        text: 'v2',
        id: '8888',
        attributes: [{ text: 'invalid', id: '9999' }],
      },
    ];
    const testHighlightedPackageNameIds = ['6666', '2222'];
    const expectedSortedAttributedPackageVersions: Array<ListWithAttributesItem> =
      [
        {
          text: '1.1.1',
          id: '7777',
          manuallyAdded: true,
        },
        {
          text: '6.0',
          id: '1111',
          attributes: [{ text: 'buffer', id: '2222' }],
        },
        {
          text: '6.0.3',
          id: '5555',
          attributes: [{ text: 'buffer', id: '6666' }],
        },
        {
          text: '1.24.0',
          id: '3333',
          attributes: [{ text: 'numpy', id: '4444' }],
        },
        {
          text: 'v2',
          id: '8888',
          attributes: [{ text: 'invalid', id: '9999' }],
        },
      ];

    const testSortedAttributedPackageVersions = sortAttributedPackageVersions(
      testAttributedPackageVersions,
      testHighlightedPackageNameIds,
    );

    expect(testSortedAttributedPackageVersions).toEqual(
      expectedSortedAttributedPackageVersions,
    );
  });
});
