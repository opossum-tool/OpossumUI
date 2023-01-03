// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  Attributions,
} from '../../../../shared/shared-types';
import { ListWithAttributesItem } from '../../../types/types';
import { getAttributionWizardPackageListsItems } from '../attribution-wizard-popup-helpers';

describe('getAttributionWizardPackageListsItems', () => {
  it('yields correct output', () => {
    const testContainedExternalPackages: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid_0', childrenWithAttributionCount: 2 },
      { attributionId: 'uuid_1', childrenWithAttributionCount: 5 },
      { attributionId: 'uuid_2', childrenWithAttributionCount: 1 },
      { attributionId: 'uuid_3', childrenWithAttributionCount: 1 },
      { attributionId: 'uuid_4', childrenWithAttributionCount: 1 },
    ];
    const testExternalAttributions: Attributions = {
      uuid_0: {
        packageName: 'boost',
        packageNamespace: 'pkg:npm',
      },
      uuid_1: {
        packageName: 'numpy',
        packageNamespace: 'pkg:pip',
      },
      uuid_2: {
        packageName: undefined,
        packageNamespace: undefined,
      },
      uuid_3: {
        packageName: '',
        packageNamespace: '',
      },
      uuid_4: {
        packageName: 'pandas',
        packageNamespace: 'pkg:pip',
      },
    };
    const expectedAttributedPackageNamespaces: Array<ListWithAttributesItem> = [
      {
        text: 'pkg:pip',
        id: 'namespace-pkg:pip',
        attributes: [
          { text: 'count: 6 (60.0%)', id: 'namespace-attribute-pkg:pip' },
        ],
      },
      {
        text: 'pkg:npm',
        id: 'namespace-pkg:npm',
        attributes: [
          { text: 'count: 2 (20.0%)', id: 'namespace-attribute-pkg:npm' },
        ],
      },
      {
        text: 'empty',
        id: 'namespace-empty',
        attributes: [
          { text: 'count: 1 (10.0%)', id: 'namespace-attribute-empty' },
        ],
      },
      {
        text: 'none',
        id: 'namespace-none',
        attributes: [
          { text: 'count: 1 (10.0%)', id: 'namespace-attribute-none' },
        ],
      },
    ];
    const expectedAttributedPackageNames: Array<ListWithAttributesItem> = [
      {
        text: 'numpy',
        id: 'name-numpy',
        attributes: [{ text: 'count: 5 (50.0%)', id: 'name-attribute-numpy' }],
      },
      {
        text: 'boost',
        id: 'name-boost',
        attributes: [{ text: 'count: 2 (20.0%)', id: 'name-attribute-boost' }],
      },
      {
        text: 'empty',
        id: 'name-empty',
        attributes: [{ text: 'count: 1 (10.0%)', id: 'name-attribute-empty' }],
      },
      {
        text: 'none',
        id: 'name-none',
        attributes: [{ text: 'count: 1 (10.0%)', id: 'name-attribute-none' }],
      },
      {
        text: 'pandas',
        id: 'name-pandas',
        attributes: [{ text: 'count: 1 (10.0%)', id: 'name-attribute-pandas' }],
      },
    ];

    const { attributedPackageNamespaces, attributedPackageNames } =
      getAttributionWizardPackageListsItems(
        testContainedExternalPackages,
        testExternalAttributions
      );

    expect(attributedPackageNamespaces).toEqual(
      expectedAttributedPackageNamespaces
    );
    expect(attributedPackageNames).toEqual(expectedAttributedPackageNames);
  });
});
