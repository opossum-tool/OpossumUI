// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { NIL as uuidNil } from 'uuid';

import { faker } from '../../../../e2e-tests/utils';
import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  Criticality,
  FrequentLicenseName,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../shared/shared-types';
import { EMPTY_ATTRIBUTION_DATA } from '../../../shared-constants';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { LocatePopupFilters } from '../../../types/types';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { createAppStore } from '../../configure-store';
import {
  initialResourceState,
  ResourceState,
} from '../../reducers/resource-reducer';
import {
  anyLocateFilterIsSet,
  attributionMatchesLocateFilter,
  calculateResourcesWithLocatedAttributions,
  computeChildrenWithAttributions,
  createHashAndOriginIdMappingsForExternalAttributions,
  getAttributionDataFromSetAttributionDataPayload,
  getAttributionIdOfFirstPackageCardInManualPackagePanel,
  getIndexOfAttributionInManualPackagePanel,
  getResourcesWithLocatedChildren,
} from '../action-and-reducer-helpers';
import { attributionForTemporaryDisplayPackageInfoExists } from '../save-action-helpers';

describe('The attributionForTemporaryDisplayPackageInfoExists function', () => {
  it('checks if manual attributions exist', () => {
    const testResources: Resources = {
      thirdParty: {
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
      },
      root: {
        src: {
          'something.js': 1,
        },
        'readme.md': 1,
      },
    };
    const testManualAttributionUuid1 = '374ba87a-f68b-11ea-adc1-0242ac120002';
    const testManualAttributionUuid2 = '374bac4e-f68b-11ea-adc1-0242ac120002';
    const testManualAttributionUuid3 = '374bar8a-f68b-11ea-adc1-0242ac120002';
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid1]: {
        packageVersion: '1.0',
        packageName: 'Typescript',
        licenseText: ' test License text',
      },
      [testManualAttributionUuid2]: {
        packageVersion: '2.0',
        packageName: 'React',
        licenseText: ' test license text',
      },
      [testManualAttributionUuid3]: {
        packageVersion: '3.0',
        packageName: 'Vue',
        licenseText: ' test license text',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/': [testManualAttributionUuid1],
      '/root/src/': [testManualAttributionUuid2],
      '/thirdParty/': [testManualAttributionUuid3],
    };
    const testExistingPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'React',
      licenseText: ' test license text',
    };
    const testNotExistingPackageInfo: PackageInfo = {
      packageVersion: '4.0',
      packageName: 'React',
      licenseText: ' test license text',
    };

    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        }),
      ),
    );

    expect(
      attributionForTemporaryDisplayPackageInfoExists(
        testExistingPackageInfo,
        testStore.getState(),
      ),
    ).toBeTruthy();
    expect(
      attributionForTemporaryDisplayPackageInfoExists(
        testNotExistingPackageInfo,
        testStore.getState(),
      ),
    ).toBeFalsy();
  });
});

describe('computeChildrenWithAttributions', () => {
  it('parses ResourcesWithAttributionsFromDb', () => {
    const testUuid: string = uuidNil;
    const mockResourcesWithAttributionsFromDb: ResourcesToAttributions = {
      '/root/src/': [testUuid],
      '/root/src/something.js/subfolder': [testUuid],
    };
    const result = computeChildrenWithAttributions(
      mockResourcesWithAttributionsFromDb,
    );

    expect(result).toEqual({
      attributedChildren: {
        '0': new Set<number>().add(3),
        '1': new Set<number>().add(0).add(3),
        '2': new Set<number>().add(0).add(3),
        '4': new Set<number>().add(3),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/src/': 0,
        '/root/src/something.js/': 4,
        '/root/src/something.js/subfolder': 3,
      },
      paths: [
        '/root/src/',
        '/',
        '/root/',
        '/root/src/something.js/subfolder',
        '/root/src/something.js/',
      ],
    });
  });
});

describe('createHashAndOriginIdMappingsForExternalAttributions', () => {
  it('yields correct results', () => {
    const originId1 = faker.string.uuid();
    const [attributionId1, packageInfo1] = faker.opossum.externalAttribution({
      packageName: faker.internet.domainWord(),
      comment: faker.lorem.sentence(),
      attributionConfidence: faker.opossum.attributionConfidence(),
      originIds: [originId1],
      preSelected: faker.datatype.boolean(),
      wasPreferred: faker.datatype.boolean(),
    });
    const originId2 = faker.string.uuid();
    const [attributionId2, packageInfo2] = faker.opossum.externalAttribution({
      ...packageInfo1,
      comment: faker.lorem.sentence(),
      attributionConfidence: faker.opossum.attributionConfidence(),
      originIds: [originId2],
      preSelected: faker.datatype.boolean(),
      wasPreferred: faker.datatype.boolean(),
    });
    const [attributionId3, packageInfo3] = faker.opossum.externalAttribution({
      ...packageInfo1,
      comment: undefined,
      attributionConfidence: undefined,
      originIds: undefined,
      preSelected: undefined,
      wasPreferred: undefined,
    });
    const [attributionId4, packageInfo4] = faker.opossum.externalAttribution({
      licenseName: '',
      firstParty: true,
    });
    const [attributionId5, packageInfo5] = faker.opossum.externalAttribution({
      ...packageInfo4,
      firstParty: true,
    });
    const [attributionId6, packageInfo6] = faker.opossum.externalAttribution({
      packageName: '',
    });
    const [attributionId7, packageInfo7] = faker.opossum.externalAttribution({
      firstParty: false,
    });

    const testExternalAttributions = faker.opossum.externalAttributions({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
      [attributionId3]: packageInfo3,
      [attributionId4]: packageInfo4,
      [attributionId5]: packageInfo5,
      [attributionId6]: packageInfo6,
      [attributionId7]: packageInfo7,
    });

    const [
      testExternalAttributionsToHashes,
      testOriginIdsToExternalAttributions,
    ] = createHashAndOriginIdMappingsForExternalAttributions(
      testExternalAttributions,
    );

    expect(testExternalAttributionsToHashes[attributionId1]).toBeDefined();
    expect(testExternalAttributionsToHashes[attributionId2]).toBeDefined();
    expect(testExternalAttributionsToHashes[attributionId3]).toBeDefined();
    expect(testExternalAttributionsToHashes[attributionId4]).toBeDefined();
    expect(testExternalAttributionsToHashes[attributionId5]).toBeDefined();
    expect(testExternalAttributionsToHashes[attributionId6]).toBeUndefined();
    expect(testExternalAttributionsToHashes[attributionId7]).toBeUndefined();

    expect(testExternalAttributionsToHashes[attributionId1]).toEqual(
      testExternalAttributionsToHashes[attributionId2],
    );
    expect(testExternalAttributionsToHashes[attributionId1]).toEqual(
      testExternalAttributionsToHashes[attributionId3],
    );
    expect(testExternalAttributionsToHashes[attributionId1]).not.toEqual(
      testExternalAttributionsToHashes[attributionId4],
    );
    expect(testExternalAttributionsToHashes[attributionId4]).toEqual(
      testExternalAttributionsToHashes[attributionId5],
    );

    expect(Object.keys(testOriginIdsToExternalAttributions)).toHaveLength(2);
    expect(testOriginIdsToExternalAttributions[originId1]).toEqual(
      attributionId1,
    );
    expect(testOriginIdsToExternalAttributions[originId2]).toEqual(
      attributionId2,
    );
  });
});

describe('getAttributionIdOfFirstPackageCardInManualPackagePanel', () => {
  it('yields correct results if all necessary data are available', () => {
    const testAttributionIds = ['uuid_0', 'uuid_1'];
    const testResourceId = 'file';
    const testState: ResourceState = {
      ...initialResourceState,
      allViews: {
        ...initialResourceState.allViews,
        manualData: {
          ...initialResourceState.allViews.manualData,
          attributions: {
            uuid_0: { packageName: 'Vue' },
            uuid_1: { packageName: 'React' },
          },
          resourcesToAttributions: { file1: ['uuid_0', 'uuid_1'] },
        },
      },
    };
    const expectedAttributionIdOfFirstPackageCard = 'uuid_1';
    const testAttributionIdOfFirstPackageCard =
      getAttributionIdOfFirstPackageCardInManualPackagePanel(
        testAttributionIds,
        testResourceId,
        testState,
      );
    expect(testAttributionIdOfFirstPackageCard).toEqual(
      expectedAttributionIdOfFirstPackageCard,
    );
  });

  it('yields empty string if attributionIds is empty and no closestParentAttributionIds', () => {
    const testAttributionIds: Array<string> = [];
    const testResourceId = 'file';
    const testState: ResourceState = {
      ...initialResourceState,
      allViews: {
        ...initialResourceState.allViews,
        manualData: {
          ...initialResourceState.allViews.manualData,
          attributions: {
            uuid_0: { packageName: 'Vue' },
            uuid_1: { packageName: 'React' },
          },
          resourcesToAttributions: { file1: ['uuid_0', 'uuid_1'] },
        },
      },
    };
    const expectedAttributionIdOfFirstPackageCard = '';
    const testAttributionIdOfFirstPackageCard =
      getAttributionIdOfFirstPackageCardInManualPackagePanel(
        testAttributionIds,
        testResourceId,
        testState,
      );
    expect(testAttributionIdOfFirstPackageCard).toEqual(
      expectedAttributionIdOfFirstPackageCard,
    );
  });

  it('yields first closesParentAttributionId if available', () => {
    const testAttributionIds = ['uuid_0', 'uuid_1', 'uuid_2', 'uuid_3'];
    const testResourceId = 'file';
    const testState: ResourceState = {
      ...initialResourceState,
      allViews: {
        ...initialResourceState.allViews,
        manualData: {
          ...initialResourceState.allViews.manualData,
          attributions: {
            uuid_0: { packageName: 'Vue' },
            uuid_1: { packageName: 'React' },
            uuid_2: { packageName: 'Jest' },
            uuid_3: { packageName: 'Angular' },
          },
          resourcesToAttributions: {
            folder: ['uuid_2', 'uuid_3'],
            'folder/file1': ['uuid_0', 'uuid_1'],
          },
        },
      },
    };
    const expectedAttributionIdOfFirstPackageCard = 'uuid_3';
    const testAttributionIdOfFirstPackageCard =
      getAttributionIdOfFirstPackageCardInManualPackagePanel(
        testAttributionIds,
        testResourceId,
        testState,
      );
    expect(testAttributionIdOfFirstPackageCard).toEqual(
      expectedAttributionIdOfFirstPackageCard,
    );
  });
});

describe('getIndexOfAttributionInManualPackagePanel', () => {
  const testManualData: AttributionData = {
    ...EMPTY_ATTRIBUTION_DATA,
    attributions: {
      uuid_0: { packageName: 'Vue' },
      uuid_1: { packageName: 'React' },
    },
    resourcesToAttributions: { file: ['uuid_0', 'uuid_1'] },
  };
  it('yields correct result if all necessary data are available', () => {
    const testTargetAttributionId = 'uuid_0';
    const testResourceId = 'file';
    const expectedIndex = 1;
    const testIndex = getIndexOfAttributionInManualPackagePanel(
      testTargetAttributionId,
      testResourceId,
      testManualData,
    );
    expect(testIndex).toEqual(expectedIndex);
  });

  it('yields null if targetAttributionId is not on resource', () => {
    const testTargetAttributionId = 'uuid_42';
    const testResourceId = 'file';
    const expectedIndex = null;
    const testIndex = getIndexOfAttributionInManualPackagePanel(
      testTargetAttributionId,
      testResourceId,
      testManualData,
    );
    expect(testIndex).toEqual(expectedIndex);
  });

  it('yields null if resource does not have attributions', () => {
    const testTargetAttributionId = 'uuid_0';
    const testResourceId = 'anotherFile';
    const expectedIndex = null;
    const testIndex = getIndexOfAttributionInManualPackagePanel(
      testTargetAttributionId,
      testResourceId,
      testManualData,
    );
    expect(testIndex).toEqual(expectedIndex);
  });
});

describe('getAttributionDataFromSetAttributionDataPayload', () => {
  it('prunes attributions without linked resources', () => {
    const expectedAttributionData: AttributionData = EMPTY_ATTRIBUTION_DATA;

    const testAttributions: Attributions = { uuid_0: { packageName: 'Vue' } };
    const testResourcesToAttributions: ResourcesToAttributions = {};
    const attributionData = getAttributionDataFromSetAttributionDataPayload({
      attributions: testAttributions,
      resourcesToAttributions: testResourcesToAttributions,
    });

    expect(attributionData).toEqual(expectedAttributionData);
  });
});

describe('calculateResourcesWithLocatedAttributions', () => {
  it('finds resource with correct attribution attached', () => {
    const selectedCriticality = SelectedCriticality.High;
    const licenseNames = new Set<string>(['GPL-2.0-or-later']);
    const externalAttributions: Attributions = {
      uuid_1: {
        packageName: 'react',
        licenseName: 'GPL-2.0-or-later',
        criticality: Criticality.High,
      },
      uuid_2: {
        packageName: 'react',
        licenseName: 'GPL-2.0-only',
        criticality: Criticality.High,
      },
    };
    const externalAttributionsToResources: AttributionsToResources = {
      uuid_1: ['/folder/file1'],
      uuid_2: ['/folder/file2'],
    };
    const frequentLicenseNames: Array<FrequentLicenseName> = [];
    const locatedResources = calculateResourcesWithLocatedAttributions(
      {
        selectedCriticality,
        selectedLicenses: licenseNames,
        searchTerm: 'gpl',
        searchOnlyLicenseName: false,
      },
      externalAttributions,
      externalAttributionsToResources,
      frequentLicenseNames,
    );
    const expectedLocatedResources = new Set<string>(['/folder/file1']);

    expect(locatedResources).toEqual(expectedLocatedResources);
  });

  it('considers license full name if frequent licenses are given', () => {
    const selectedCriticality = SelectedCriticality.High;
    const licenseNames = new Set<string>(['GPL-2.0-or-later']);
    const externalAttributions: Attributions = {
      uuid_1: {
        packageName: 'react',
        licenseName: 'GNU General Public License v2.0 or later',
        criticality: Criticality.High,
      },
    };
    const externalAttributionsToResources: AttributionsToResources = {
      uuid_1: ['/folder/file'],
    };
    const frequentLicenseNames: Array<FrequentLicenseName> = [
      {
        shortName: 'GPL-2.0-or-later',
        fullName: 'GNU General Public License v2.0 or later',
      },
    ];
    const locatedResources = calculateResourcesWithLocatedAttributions(
      {
        selectedCriticality,
        selectedLicenses: licenseNames,
        searchTerm: '',
        searchOnlyLicenseName: false,
      },
      externalAttributions,
      externalAttributionsToResources,
      frequentLicenseNames,
    );
    const expectedLocatedResources = new Set<string>(['/folder/file']);

    expect(locatedResources).toEqual(expectedLocatedResources);
  });

  it('yields results with arbitrary criticality if criticality is not specified', () => {
    const selectedCriticality = SelectedCriticality.Any;
    const licenseNames = new Set<string>(['GPL-2.0-or-later']);
    const externalAttributions: Attributions = {
      uuid_1: {
        packageName: 'react',
        licenseName: 'GPL-2.0-or-later',
        criticality: Criticality.High,
      },
      uuid_2: {
        packageName: 'angular',
        licenseName: 'GPL-2.0-or-later',
        criticality: Criticality.Medium,
      },
      uuid_3: {
        packageName: 'vue',
        licenseName: 'GPL-2.0-or-later',
        criticality: undefined,
      },
    };
    const externalAttributionsToResources: AttributionsToResources = {
      uuid_1: ['/folder/file1'],
      uuid_2: ['/folder/file2'],
      uuid_3: ['/folder/file3'],
    };
    const frequentLicenseNames: Array<FrequentLicenseName> = [];
    const locatedResources = calculateResourcesWithLocatedAttributions(
      {
        selectedCriticality,
        selectedLicenses: licenseNames,
        searchTerm: '',
        searchOnlyLicenseName: false,
      },
      externalAttributions,
      externalAttributionsToResources,
      frequentLicenseNames,
    );
    const expectedLocatedResources = new Set<string>([
      '/folder/file1',
      '/folder/file2',
      '/folder/file3',
    ]);

    expect(locatedResources).toEqual(expectedLocatedResources);
  });

  it('yields results with arbitrary license name if license name is not specified', () => {
    const selectedCriticality = SelectedCriticality.High;
    const licenseNames = new Set<string>();
    const externalAttributions: Attributions = {
      uuid_1: {
        packageName: 'react',
        licenseName: 'GPL-2.0-or-later',
        criticality: Criticality.High,
      },
      uuid_2: {
        packageName: 'angular',
        licenseName: 'GPL-2.0-only',
        criticality: Criticality.High,
      },
      uuid_3: {
        packageName: 'vue',
        licenseName: 'MIT',
        criticality: Criticality.High,
      },
    };
    const externalAttributionsToResources: AttributionsToResources = {
      uuid_1: ['/folder/file1'],
      uuid_2: ['/folder/file2'],
      uuid_3: ['/folder/file3'],
    };
    const frequentLicenseNames: Array<FrequentLicenseName> = [];
    const locatedResources = calculateResourcesWithLocatedAttributions(
      {
        selectedCriticality,
        selectedLicenses: licenseNames,
        searchTerm: '',
        searchOnlyLicenseName: false,
      },
      externalAttributions,
      externalAttributionsToResources,
      frequentLicenseNames,
    );
    const expectedLocatedResources = new Set<string>([
      '/folder/file1',
      '/folder/file2',
      '/folder/file3',
    ]);

    expect(locatedResources).toEqual(expectedLocatedResources);
  });

  it('yields results satisfying the search query', () => {
    const licenseNames = new Set<string>();
    const externalAttributions: Attributions = {
      uuid_1: {
        packageName: 'react',
        licenseName: 'GPL-2.0-or-later',
        criticality: Criticality.High,
      },
      uuid_2: {
        packageName: 'angular',
        licenseName: 'GPL-2.0-only',
        criticality: Criticality.High,
      },
      uuid_3: {
        packageName: 'vue',
        licenseName: 'MIT',
        criticality: Criticality.High,
      },
    };
    const externalAttributionsToResources: AttributionsToResources = {
      uuid_1: ['/folder/file1'],
      uuid_2: ['/folder/file2'],
      uuid_3: ['/folder/file3'],
    };
    const frequentLicenseNames: Array<FrequentLicenseName> = [];
    const locatedResources = calculateResourcesWithLocatedAttributions(
      {
        selectedCriticality: SelectedCriticality.Any,
        selectedLicenses: licenseNames,
        searchTerm: '2.0-only',
        searchOnlyLicenseName: false,
      },
      externalAttributions,
      externalAttributionsToResources,
      frequentLicenseNames,
    );
    const expectedLocatedResources = new Set<string>(['/folder/file2']);

    expect(locatedResources).toEqual(expectedLocatedResources);
  });
});

describe('getResourcesWithLocatedChildren', () => {
  it('yields all parents of a resource', () => {
    const locatedResources = new Set<string>([
      '/folder1/folder2/file',
      '/folder1/folder2/otherFile',
      '/folder1/folder3/file',
    ]);
    const parents = getResourcesWithLocatedChildren(locatedResources);
    const expectedParents = new Set<string>([
      '/',
      '/folder1/',
      '/folder1/folder2/',
      '/folder1/folder3/',
    ]);
    expect(parents).toEqual(expectedParents);
  });

  it('returns empty set if input is root', () => {
    const locatedResources = new Set<string>(['/']);
    const parents = getResourcesWithLocatedChildren(locatedResources);
    const expectedParents = new Set<string>();
    expect(parents).toEqual(expectedParents);
  });
});

describe('attributionMatchesLocatedFilters', () => {
  it('is true if matched', () => {
    const testPackageInfo: PackageInfo = {
      criticality: Criticality.High,
      licenseName: 'MIT',
    };
    const locatePopupFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.High,
      selectedLicenses: new Set(['MIT']),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(
      attributionMatchesLocateFilter(testPackageInfo, locatePopupFilter, []),
    ).toBeTruthy();
  });

  it('is false if no filter matches', () => {
    const testPackageInfo: PackageInfo = {
      criticality: Criticality.High,
      licenseName: 'Apache',
    };
    const locatePopupFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.High,
      selectedLicenses: new Set(['MIT']),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(
      attributionMatchesLocateFilter(testPackageInfo, locatePopupFilter, []),
    ).toBeFalsy();
  });
  it('is true if no filter selected', () => {
    const testPackageInfo: PackageInfo = {
      criticality: Criticality.High,
      licenseName: 'Apache',
    };
    const locatePopupFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set([]),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(
      attributionMatchesLocateFilter(testPackageInfo, locatePopupFilter, []),
    ).toBeTruthy();
  });

  it('is true if the license matches a frequent license', () => {
    const testPackageInfo: PackageInfo = {
      criticality: Criticality.High,
      licenseName: 'MIT License',
    };
    const locatePopupFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set(['MIT']),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(
      attributionMatchesLocateFilter(testPackageInfo, locatePopupFilter, [
        { shortName: 'MIT', fullName: 'MIT License' },
      ]),
    ).toBeTruthy();
  });
});

describe('anyLocateFilterIsSet', () => {
  it('is true if the criticality filter is set', () => {
    const testLocateFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.High,
      selectedLicenses: new Set(),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(anyLocateFilterIsSet(testLocateFilter)).toBeTruthy();
  });

  it('is true if the license filter is set', () => {
    const testLocateFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set(['MIT']),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(anyLocateFilterIsSet(testLocateFilter)).toBeTruthy();
  });

  it('is true if a searchTerm filter is set', () => {
    const testLocateFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set(),
      searchTerm: 'package',
      searchOnlyLicenseName: false,
    };
    expect(anyLocateFilterIsSet(testLocateFilter)).toBeTruthy();
  });

  it('is false if no filter is set', () => {
    const testLocateFilter: LocatePopupFilters = {
      selectedCriticality: SelectedCriticality.Any,
      selectedLicenses: new Set(),
      searchTerm: '',
      searchOnlyLicenseName: false,
    };
    expect(anyLocateFilterIsSet(testLocateFilter)).toBeFalsy();
  });
});
