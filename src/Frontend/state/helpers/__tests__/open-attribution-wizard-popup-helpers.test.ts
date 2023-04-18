// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import {
  AttributionIdWithCount,
  PackageAttributes,
} from '../../../types/types';
import {
  getAllAttributionIdsWithCountsFromResourceAndChildren,
  getAttributionWizardInitialState,
  getPackageVersionsWithRelatedPackageNameIds,
  getPreSelectedPackageAttributeIds,
} from '../open-attribution-wizard-popup-helpers';
import { computeChildrenWithAttributions } from '../action-and-reducer-helpers';

describe('getExternalAndManualAttributionIdsWithCountsFromResourceAndChildren', () => {
  it('yields correct output', () => {
    const testSelectedResourceId = '/samplepath/';
    const testResourcesToExternalAttributions = {
      '/samplepath/file_0': ['uuid_0'],
      '/samplepath/subfolder/file_1': ['uuid_1'],
      '/samplepath/subfolder/file_2': ['uuid_0'],
    };
    const testResourcesWithExternallyAttributedChildren =
      computeChildrenWithAttributions(testResourcesToExternalAttributions);
    const testResourcesToManualAttributions = {
      '/samplepath/subfolder/file_0': ['uuid_2'],
      '/samplepath/subfolder_2/file_3': ['uuid_3'],
      '/samplepath/subfolder_2/file_4': ['uuid_4'],
    };
    const testResourcesWithManuallyAttributedChildren =
      computeChildrenWithAttributions(testResourcesToManualAttributions);

    const testResolvedExternalAttributions: Set<string> = new Set<string>();

    const expectedTestAttributionsWithCounts: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid_0', count: 2 },
      { attributionId: 'uuid_1', count: 1 },
      { attributionId: 'uuid_2', count: 1 },
      { attributionId: 'uuid_3', count: 1 },
      { attributionId: 'uuid_4', count: 1 },
    ];

    const testAttributionsWithCounts =
      getAllAttributionIdsWithCountsFromResourceAndChildren(
        testSelectedResourceId,
        testResourcesToExternalAttributions,
        testResourcesWithExternallyAttributedChildren,
        testResourcesToManualAttributions,
        testResourcesWithManuallyAttributedChildren,
        testResolvedExternalAttributions
      );

    expect(testAttributionsWithCounts).toEqual(
      expectedTestAttributionsWithCounts
    );
  });
});

describe('getAttributionWizardInitialState', () => {
  it('yields correct output', () => {
    const testExternalAndManualAttributionIdsWithCounts: Array<AttributionIdWithCount> =
      [
        { attributionId: '1111', count: 1 },
        { attributionId: '2222', count: 1 },
        { attributionId: '3333', count: 3 },
      ];
    const testExternalAndManualAttributions: Attributions = {
      '1111': {
        packageName: 'boost',
        packageNamespace: 'npm',
        packageVersion: '0.63.1',
      },
      '2222': {
        packageName: 'buffer',
        packageNamespace: 'npm',
        packageVersion: '6.0.3',
      },
      '3333': {
        packageName: 'numpy',
        packageNamespace: 'pip',
        packageVersion: '1.24.0',
      },
    };
    const expectedPackageNamespacesValues = [
      { text: 'npm', count: 2 },
      { text: 'pip', count: 3 },
    ];
    const expectedPackageNamesValues = [
      { text: 'boost', count: 1 },
      { text: 'buffer', count: 1 },
      { text: 'numpy', count: 3 },
    ];
    const expectedPackageVersionsValues = [
      { text: '0.63.1' },
      { text: '6.0.3' },
      { text: '1.24.0' },
    ];
    const expectedTotalAttributionCount = 5;

    const {
      packageNamespaces: testPackageNamespaces,
      packageNames: testPackageNames,
      packageVersions: testPackageVersions,
      totalAttributionCount: testTotalAttributionCount,
    } = getAttributionWizardInitialState(
      testExternalAndManualAttributionIdsWithCounts,
      testExternalAndManualAttributions
    );

    expect(Object.values(testPackageNamespaces)).toEqual(
      expectedPackageNamespacesValues
    );
    expect(Object.values(testPackageNames)).toEqual(expectedPackageNamesValues);
    Object.values(testPackageVersions).forEach((packageVersion, index) => {
      expect(packageVersion.text).toBe(
        expectedPackageVersionsValues[index].text
      );
      expect(packageVersion).toHaveProperty('relatedIds');
    });
    expect(testTotalAttributionCount).toBe(expectedTotalAttributionCount);
  });
});

describe('getPackageVersionsWithRelatedPackageNameIds', () => {
  it('yields correct output', () => {
    const testPackageVersionsToNames = {
      '1.1.1': new Set<string>(['boost', 'buffer']),
      '1.24.0': new Set<string>(['numpy']),
    };
    const testPackageNames: PackageAttributes = {
      uuid_0: { text: 'buffer' },
      uuid_1: { text: 'boost' },
      uuid_2: { text: 'numpy' },
    };
    const expectedPackageVersionsValues = [
      { text: '1.1.1', relatedIds: new Set<string>(['uuid_1', 'uuid_0']) },
      { text: '1.24.0', relatedIds: new Set<string>(['uuid_2']) },
    ];

    const testPackageVersions = getPackageVersionsWithRelatedPackageNameIds(
      testPackageVersionsToNames,
      testPackageNames
    );

    expect(Object.values(testPackageVersions)).toEqual(
      expectedPackageVersionsValues
    );
  });
});

describe('getPreSelectedPackageAttributeIds', () => {
  it('yields correct output', () => {
    const testStartingAttribution: PackageInfo = {
      packageNamespace: 'npm',
      packageName: 'buffer',
      packageVersion: '6.0.3',
    };
    const testPackageNamespaces: PackageAttributes = {
      '1111': { text: 'npm' },
      '2222': { text: 'pip' },
    };
    const testPackageNames: PackageAttributes = {
      '3333': { text: 'buffer' },
      '4444': { text: 'numpy' },
    };
    const testPackageVersions: PackageAttributes = {
      '5555': { text: '6.0.3' },
      '6666': { text: '1.24.0' },
    };
    const expectedPreSelectedPackageAttributeIds = {
      preSelectedPackageNamespaceId: '1111',
      preSelectedPackageNameId: '3333',
      preSelectedPackageVersionId: '5555',
    };

    const testPreSelectedPackageAttributeIds =
      getPreSelectedPackageAttributeIds(
        testStartingAttribution,
        testPackageNamespaces,
        testPackageNames,
        testPackageVersions
      );

    expect(testPreSelectedPackageAttributeIds).toEqual(
      expectedPreSelectedPackageAttributeIds
    );
  });
});
