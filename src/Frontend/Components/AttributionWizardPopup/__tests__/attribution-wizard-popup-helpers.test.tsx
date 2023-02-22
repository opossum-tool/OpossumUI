// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ListWithAttributesItem,
  PackageAttributes,
} from '../../../types/types';
import { getAttributionWizardListItems } from '../attribution-wizard-popup-helpers';

describe('getAttributionWizardListItems', () => {
  it('yields correct output', () => {
    const testPackageNamespaces: PackageAttributes = {
      uuid_0: { text: 'npm', count: 6 },
      uuid_1: { text: 'pip', count: 4 },
      uuid_2: { text: 'new_namespace', manuallyAdded: true },
    };
    const testPackageNames: PackageAttributes = {
      uuid_3: { text: 'buffer', count: 6 },
      uuid_4: { text: 'numpy', count: 4 },
      uuid_5: { text: 'new_name', manuallyAdded: true },
    };
    const testPackageVersions: PackageAttributes = {
      uuid_6: { text: '6.0.2', relatedIds: new Set<string>(['uuid_3']) },
      uuid_7: { text: '1.24.0', relatedIds: new Set<string>(['uuid_4']) },
      uuid_8: { text: '6.0', relatedIds: new Set<string>(['uuid_3']) },
      uuid_9: { text: 'new_version', manuallyAdded: true },
    };
    const testTotalAttributionCount = 10;
    const expectedAttributedPackageNamespacesWithManuallyAddedOnes: Array<ListWithAttributesItem> =
      [
        {
          text: 'npm',
          id: 'uuid_0',
          attributes: [{ text: '6 (60%)' }],
        },
        {
          text: 'pip',
          id: 'uuid_1',
          attributes: [{ text: '4 (40%)' }],
        },
        { text: 'new_namespace', id: 'uuid_2', manuallyAdded: true },
      ];
    const expectedAttributedPackageNamesWithManuallyAddedOnes: Array<ListWithAttributesItem> =
      [
        {
          text: 'buffer',
          id: 'uuid_3',
          attributes: [{ text: '6 (60%)' }],
        },
        {
          text: 'numpy',
          id: 'uuid_4',
          attributes: [{ text: '4 (40%)' }],
        },
        { text: 'new_name', id: 'uuid_5', manuallyAdded: true },
      ];
    const expectedAttributedPackageVersionsWithManuallyAddedOnes: Array<ListWithAttributesItem> =
      [
        {
          text: '6.0.2',
          id: 'uuid_6',
          attributes: [{ text: 'buffer', id: 'uuid_3' }],
        },
        {
          text: '1.24.0',
          id: 'uuid_7',
          attributes: [{ text: 'numpy', id: 'uuid_4' }],
        },
        {
          text: '6.0',
          id: 'uuid_8',
          attributes: [{ text: 'buffer', id: 'uuid_3' }],
        },
        { text: 'new_version', id: 'uuid_9', manuallyAdded: true },
      ];
    const {
      attributedPackageNamespacesWithManuallyAddedOnes:
        testAttributedPackageNamespacesWithManuallyAddedOnes,
      attributedPackageNamesWithManuallyAddedOnes:
        testAttributedPackageNamesWithManuallyAddedOnes,
      attributedPackageVersionsWithManuallyAddedOnes:
        testAttributedPackageVersionsWithManuallyAddedOnes,
    } = getAttributionWizardListItems(
      testPackageNamespaces,
      testPackageNames,
      testPackageVersions,
      testTotalAttributionCount
    );

    expect(testAttributedPackageNamespacesWithManuallyAddedOnes).toEqual(
      expectedAttributedPackageNamespacesWithManuallyAddedOnes
    );
    expect(testAttributedPackageNamesWithManuallyAddedOnes).toEqual(
      expectedAttributedPackageNamesWithManuallyAddedOnes
    );
    expect(testAttributedPackageVersionsWithManuallyAddedOnes).toEqual(
      expectedAttributedPackageVersionsWithManuallyAddedOnes
    );
  });
});
