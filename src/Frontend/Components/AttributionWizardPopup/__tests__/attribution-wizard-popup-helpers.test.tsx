// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  AttributionIdWithCount,
  Attributions,
  PackageInfo,
} from '../../../../shared/shared-types';
import { ListWithAttributesItem } from '../../../types/types';
import {
  emptyAttribute,
  getAttributionWizardPackageListsItems,
  getAttributionWizardPackageVersionListItems,
  getAllAttributionIdsWithCountsFromResourceAndChildren,
  getHighlightedPackageNameIds,
  getPreSelectedPackageAttributeIds,
  convertManuallyAddedListEntriesToListItems,
  getManuallyAddedPackageNamesToVersions,
} from '../attribution-wizard-popup-helpers';

describe('getExternalAndManualAttributionIdsWithCountsFromResourceAndChildren', () => {
  it('yields correct output', () => {
    const testSelectedResourceId = '/samplepath/';
    const testExternalData: AttributionData = {
      attributionsToResources: {},
      resourcesWithAttributedChildren: {
        '/samplepath/': new Set<string>([
          '/samplepath/file_0',
          '/samplepath/subfolder/file_1',
          '/samplepath/subfolder/file_2',
        ]),
      },
      resourcesToAttributions: {
        '/samplepath/file_0': ['uuid_0'],
        '/samplepath/subfolder/file_1': ['uuid_1'],
        '/samplepath/subfolder/file_2': ['uuid_0'],
      },
      attributions: {},
    };
    const testManualData: AttributionData = {
      attributionsToResources: {},
      resourcesWithAttributedChildren: {
        '/samplepath/': new Set<string>([
          '/samplepath/subfolder/file_0',
          '/samplepath/subfolder_2/file_3',
          '/samplepath/subfolder_2/file_4',
        ]),
      },
      resourcesToAttributions: {
        '/samplepath/subfolder/file_0': ['uuid_2'],
        '/samplepath/subfolder_2/file_3': ['uuid_3'],
        '/samplepath/subfolder_2/file_4': ['uuid_4'],
      },
      attributions: {},
    };
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
        testExternalData,
        testManualData,
        testResolvedExternalAttributions
      );

    expect(testAttributionsWithCounts).toEqual(
      expectedTestAttributionsWithCounts
    );
  });
});

describe('getPreSelectedPackageAttributeIds', () => {
  it('yields correct output', () => {
    const testPackageInfo: PackageInfo = {
      packageVersion: '6.0.3',
      packageNamespace: 'npm',
      packageName: 'buffer',
    };
    const expectedPreSelectedPackageNamespaceId = 'namespace-npm';
    const expectedPreSelectedPackageNameId = 'name-buffer';
    const expectedPreSelectedPackageVersionId = 'version-6.0.3';

    const {
      preSelectedPackageNamespaceId: testPreSelectedPackageNamespaceId,
      preSelectedPackageNameId: testPreSelectedPackageNameId,
      preSelectedPackageVersionId: testPreSelectedPackageVersionId,
    } = getPreSelectedPackageAttributeIds(testPackageInfo);

    expect(testPreSelectedPackageNamespaceId).toEqual(
      expectedPreSelectedPackageNamespaceId
    );
    expect(testPreSelectedPackageNameId).toEqual(
      expectedPreSelectedPackageNameId
    );
    expect(testPreSelectedPackageVersionId).toEqual(
      expectedPreSelectedPackageVersionId
    );
  });
});

describe('getAttributionWizardPackageListsItems', () => {
  it('yields correct output', () => {
    const testContainedExternalPackages: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid_0', count: 1 },
      { attributionId: 'uuid_1', count: 5 },
      { attributionId: 'uuid_2', count: 1 },
      { attributionId: 'uuid_3', count: 1 },
      { attributionId: 'uuid_4', count: 1 },
      { attributionId: 'uuid_5', count: 1 },
    ];
    const testExternalAttributions: Attributions = {
      uuid_0: {
        packageName: 'buffer',
        packageNamespace: 'npm',
        packageVersion: '6.0.3',
      },
      uuid_1: {
        packageName: 'numpy',
        packageNamespace: 'pip',
        packageVersion: '1.24.0',
      },
      uuid_2: {
        packageName: undefined,
        packageNamespace: undefined,
        packageVersion: undefined,
      },
      uuid_3: {
        packageName: '',
        packageNamespace: '',
        packageVersion: '',
      },
      uuid_4: {
        packageName: 'pandas',
        packageNamespace: 'pip',
        packageVersion: '1.5.2',
      },
      uuid_5: {
        packageName: 'buffer',
        packageNamespace: 'npm',
        packageVersion: '6.0',
      },
    };
    const testManuallyAddedNamespaces: Array<string> = [];
    const testManuallyAddedNames: Array<string> = [];
    const expectedAttributedPackageNamespaces: Array<ListWithAttributesItem> = [
      {
        text: 'pip',
        id: 'namespace-pip',
        attributes: [{ text: '6 (60%)', id: 'namespace-attribute-pip' }],
      },
      {
        text: emptyAttribute,
        id: `namespace-${emptyAttribute}`,
        attributes: [
          {
            text: '2 (20%)',
            id: `namespace-attribute-${emptyAttribute}`,
          },
        ],
      },
      {
        text: 'npm',
        id: 'namespace-npm',
        attributes: [{ text: '2 (20%)', id: 'namespace-attribute-npm' }],
      },
    ];
    const expectedAttributedPackageNames: Array<ListWithAttributesItem> = [
      {
        text: 'numpy',
        id: 'name-numpy',
        attributes: [{ text: '5 (50%)', id: 'name-attribute-numpy' }],
      },
      {
        text: emptyAttribute,
        id: `name-${emptyAttribute}`,
        attributes: [
          { text: '2 (20%)', id: `name-attribute-${emptyAttribute}` },
        ],
      },
      {
        text: 'buffer',
        id: 'name-buffer',
        attributes: [{ text: '2 (20%)', id: 'name-attribute-buffer' }],
      },
      {
        text: 'pandas',
        id: 'name-pandas',
        attributes: [{ text: '1 (10%)', id: 'name-attribute-pandas' }],
      },
    ];
    const expectedPackageNamesToVersions = {
      buffer: new Set<string>(['6.0.3', '6.0']),
      numpy: new Set<string>(['1.24.0']),
      pandas: new Set<string>(['1.5.2']),
      [emptyAttribute]: new Set<string>([emptyAttribute]),
    };

    const {
      attributedPackageNamespaces,
      attributedPackageNames,
      packageNamesToVersions,
    } = getAttributionWizardPackageListsItems(
      testContainedExternalPackages,
      testExternalAttributions,
      testManuallyAddedNamespaces,
      testManuallyAddedNames
    );

    expect(attributedPackageNamespaces).toEqual(
      expectedAttributedPackageNamespaces
    );
    expect(attributedPackageNames).toEqual(expectedAttributedPackageNames);
    expect(packageNamesToVersions).toEqual(expectedPackageNamesToVersions);
  });
});

describe('getAttributionWizardPackageVersionListItems', () => {
  it('yields correct output', () => {
    const testPackageName = 'buffer';
    const testPackageName2 = 'buffer2';
    const testPackageNamesToVersions = {
      [testPackageName]: new Set<string>(['6.0.3', '6.0']),
      [testPackageName2]: new Set<string>(['6.0.3']),
      numpy: new Set<string>(['1.24.0']),
    };
    const testManuallyAddedVersions: Array<string> = [];

    const expectedPackageVersionListItems = [
      {
        text: '6.0',
        id: 'version-6.0',
        attributes: [
          {
            text: testPackageName,
            id: `version-6.0-name-${testPackageName}`,
          },
        ],
      },
      {
        text: '6.0.3',
        id: 'version-6.0.3',
        attributes: [
          {
            text: testPackageName,
            id: `version-6.0.3-name-${testPackageName}`,
          },
          {
            text: testPackageName2,
            id: `version-6.0.3-name-${testPackageName2}`,
          },
        ],
      },
    ];

    const testPackageVersionListItems =
      getAttributionWizardPackageVersionListItems(
        testPackageName,
        testPackageNamesToVersions,
        testManuallyAddedVersions
      );

    expect(testPackageVersionListItems).toEqual(
      expectedPackageVersionListItems
    );
  });
});

describe('getHighlightedPackeNameIds', () => {
  it('yields correct output', () => {
    const testSelectedPackageName = 'buffer';
    const testPackageNamesToVersions = {
      buffer: new Set<string>(['6.0.3', '6.0']),
      numpy: new Set<string>(['1.24.0']),
    };
    const expectedHighlightedPackeNameIds = [
      'version-6.0.3-name-buffer',
      'version-6.0-name-buffer',
    ];

    const testHighlightedPackageNameIds = getHighlightedPackageNameIds(
      testSelectedPackageName,
      testPackageNamesToVersions
    );

    expect(testHighlightedPackageNameIds).toEqual(
      expectedHighlightedPackeNameIds
    );
  });
});

describe('convertManuallyAddedListEntriesToListItems', () => {
  it('yields correct output', () => {
    const testManuallyAddedListEntries = ['new_package_0', 'new_package_1'];
    const testPackageAttributeId = 'name';
    const expectedNewListItems: Array<ListWithAttributesItem> = [
      {
        text: 'new_package_0',
        manuallyAdded: true,
        id: 'name-new_package_0',
      },
      {
        text: 'new_package_1',
        manuallyAdded: true,
        id: 'name-new_package_1',
      },
    ];

    const testNewListItems = convertManuallyAddedListEntriesToListItems(
      testManuallyAddedListEntries,
      testPackageAttributeId
    );

    expect(testNewListItems).toEqual(expectedNewListItems);
  });
});

describe('getManuallyAddedPackageNamesToVersions', () => {
  it('yields correct output', () => {
    const testManuallyAddedPackageNames = ['new_package_0', 'new_package_1'];
    const expectedNewPackageNamesToVersions = {
      ['new_package_0']: new Set<string>([emptyAttribute]),
      ['new_package_1']: new Set<string>([emptyAttribute]),
    };
    const testNewPackageNamesToVersions =
      getManuallyAddedPackageNamesToVersions(testManuallyAddedPackageNames);

    expect(testNewPackageNamesToVersions).toEqual(
      expectedNewPackageNamesToVersions
    );
  });
});
