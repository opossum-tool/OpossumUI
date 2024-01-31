// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  Criticality,
  FrequentLicenseName,
  PackageInfo,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { EMPTY_ATTRIBUTION_DATA } from '../../../shared-constants';
import { LocatePopupFilters } from '../../../types/types';
import {
  initialResourceState,
  ResourceState,
} from '../../reducers/resource-reducer';
import {
  anyLocateFilterIsSet,
  attributionMatchesLocateFilter,
  calculateResourcesWithLocatedAttributions,
  computeChildrenWithAttributions,
  getAttributionDataFromSetAttributionDataPayload,
  getAttributionIdOfFirstPackageCardInManualPackagePanel,
  getResourcesWithLocatedChildren,
} from '../action-and-reducer-helpers';

describe('computeChildrenWithAttributions', () => {
  it('parses ResourcesWithAttributionsFromDb', () => {
    const testUuid = faker.string.uuid();
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
            uuid_0: { packageName: 'Vue', id: 'uuid_0' },
            uuid_1: { packageName: 'React', id: 'uuid_1' },
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
            uuid_0: { packageName: 'Vue', id: 'uuid_0' },
            uuid_1: { packageName: 'React', id: 'uuid_1' },
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
            uuid_0: { packageName: 'Vue', id: 'uuid_0' },
            uuid_1: { packageName: 'React', id: 'uuid_1' },
            uuid_2: { packageName: 'Jest', id: 'uuid_2' },
            uuid_3: { packageName: 'Angular', id: 'uuid_3' },
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

describe('getAttributionDataFromSetAttributionDataPayload', () => {
  it('prunes attributions without linked resources', () => {
    const expectedAttributionData: AttributionData = EMPTY_ATTRIBUTION_DATA;

    const testAttributions: Attributions = {
      uuid_0: { packageName: 'Vue', id: 'uuid_0' },
    };
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
        id: 'uuid_1',
      },
      uuid_2: {
        packageName: 'react',
        licenseName: 'GPL-2.0-only',
        criticality: Criticality.High,
        id: 'uuid_2',
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
        id: 'uuid_1',
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
        id: 'uuid_1',
      },
      uuid_2: {
        packageName: 'angular',
        licenseName: 'GPL-2.0-or-later',
        criticality: Criticality.Medium,
        id: 'uuid_2',
      },
      uuid_3: {
        packageName: 'vue',
        licenseName: 'GPL-2.0-or-later',
        criticality: undefined,
        id: 'uuid_3',
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
        id: 'uuid_1',
      },
      uuid_2: {
        packageName: 'angular',
        licenseName: 'GPL-2.0-only',
        criticality: Criticality.High,
        id: 'uuid_2',
      },
      uuid_3: {
        packageName: 'vue',
        licenseName: 'MIT',
        criticality: Criticality.High,
        id: 'uuid_3',
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
        id: 'uuid_1',
      },
      uuid_2: {
        packageName: 'angular',
        licenseName: 'GPL-2.0-only',
        criticality: Criticality.High,
        id: 'uuid_2',
      },
      uuid_3: {
        packageName: 'vue',
        licenseName: 'MIT',
        criticality: Criticality.High,
        id: 'uuid_3',
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
      id: faker.string.uuid(),
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
      id: faker.string.uuid(),
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
      id: faker.string.uuid(),
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
      id: faker.string.uuid(),
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
