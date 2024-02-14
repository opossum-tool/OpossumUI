// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  DiscreteConfidence,
  FrequentLicenses,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { getAttributionsToResources } from '../../../../test-helpers/general-test-helpers';
import { createAppStore } from '../../../configure-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getBaseUrlsForSources,
  getExternalAttributions,
  getExternalAttributionSources,
  getExternalAttributionsToResources,
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
  getIsPreferenceFeatureEnabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/resource-selectors';
import {
  resetResourceState,
  setBaseUrlsForSources,
  setExternalAttributionSources,
  setExternalData,
  setFrequentLicenses,
  setIsPreferenceFeatureEnabled,
  setManualData,
  setResources,
  setTemporaryDisplayPackageInfo,
} from '../all-views-simple-actions';
import { setSelectedResourceId } from '../audit-view-simple-actions';

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

const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
const testTemporaryDisplayPackageInfo: PackageInfo = {
  attributionConfidence: DiscreteConfidence.High,
  packageVersion: '1.0',
  packageName: 'test Package',
  licenseText: ' test License text',
  id: testManualAttributionUuid_1,
};
const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
  packageVersion: '2.0',
  packageName: 'not assigned test Package',
  licenseText: ' test not assigned License text',
  id: testManualAttributionUuid_2,
};
const testManualAttributions: Attributions = {
  [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
  [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
};
const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/root/src/something.js': [testManualAttributionUuid_1],
};
const testManualAttributionsToResources = getAttributionsToResources(
  testResourcesToManualAttributions,
);

describe('The load and navigation simple actions', () => {
  it('resets the state', () => {
    const testStore = createAppStore();
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      id: testManualAttributionUuid_1,
    };
    testStore.dispatch(
      setManualData(
        testManualAttributions,
        testResourcesToManualAttributions,
        testManualAttributionsToResources,
      ),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );

    testStore.dispatch(resetResourceState());

    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState,
    );
  });

  it('sets and gets resources', () => {
    const testStore = createAppStore();
    testStore.dispatch(setResources(testResources));
    expect(getResources(testStore.getState())).toMatchObject(testResources);
  });

  it('sets and gets manual attribution data', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
      uuid2: { packageName: 'Redux', id: 'uuid2' },
    };
    const testResourcesToAttributions: ResourcesToAttributions = {
      '/some/path1': ['uuid1', 'uuid2'],
      '/some/path2': ['uuid1'],
    };
    const testAttributionsToResources = getAttributionsToResources(
      testResourcesToAttributions,
    );
    const expectedResourcesWithAttributedChildren: ResourcesWithAttributedChildren =
      {
        attributedChildren: {
          '1': new Set<number>().add(0).add(3),
          '2': new Set<number>().add(0).add(3),
        },
        pathsToIndices: {
          '/': 1,
          '/some/': 2,
          '/some/path1': 0,
          '/some/path2': 3,
        },
        paths: ['/some/path1', '/', '/some/', '/some/path2'],
      };

    const testStore = createAppStore();
    expect(getManualAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({});
    expect(getManualAttributionsToResources(testStore.getState())).toEqual({});
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });

    testStore.dispatch(
      setManualData(
        testAttributions,
        testResourcesToAttributions,
        testAttributionsToResources,
      ),
    );
    expect(getManualAttributions(testStore.getState())).toEqual(
      testAttributions,
    );
    expect(getManualAttributionsToResources(testStore.getState())).toEqual(
      testAttributionsToResources,
    );
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual(expectedResourcesWithAttributedChildren);
  });

  it('sets and gets external attribution data', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
      uuid2: { packageName: 'Redux', id: 'uuid2' },
    };
    const testResourcesToAttributions: ResourcesToAttributions = {
      '/some/path1': ['uuid1', 'uuid2'],
      '/some/path2': ['uuid1'],
    };
    const testAttributionsToResources = getAttributionsToResources(
      testResourcesToAttributions,
    );
    const expectedResourcesWithAttributedChildren: ResourcesWithAttributedChildren =
      {
        attributedChildren: {
          '1': new Set<number>().add(0).add(3),
          '2': new Set<number>().add(0).add(3),
        },
        pathsToIndices: {
          '/': 1,
          '/some/': 2,
          '/some/path1': 0,
          '/some/path2': 3,
        },
        paths: ['/some/path1', '/', '/some/', '/some/path2'],
      };

    const testStore = createAppStore();
    expect(getExternalAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToExternalAttributions(testStore.getState())).toEqual(
      {},
    );
    expect(getExternalAttributionsToResources(testStore.getState())).toEqual(
      {},
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState()),
    ).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });

    testStore.dispatch(
      setExternalData(
        testAttributions,
        testResourcesToAttributions,
        testAttributionsToResources,
        new Set(),
      ),
    );
    expect(getExternalAttributions(testStore.getState())).toEqual(
      testAttributions,
    );
    expect(getResourcesToExternalAttributions(testStore.getState())).toEqual(
      testResourcesToAttributions,
    );
    expect(getExternalAttributionsToResources(testStore.getState())).toEqual(
      testAttributionsToResources,
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState()),
    ).toEqual(expectedResourcesWithAttributedChildren);
  });

  it('sets and gets frequentLicenses', () => {
    const testFrequentLicenses: FrequentLicenses = {
      nameOrder: [
        { shortName: 'MIT', fullName: 'MIT license' },
        {
          shortName: 'GPL',
          fullName: 'General Public License',
        },
      ],
      texts: { MIT: 'MIT text', GPL: 'GPL text' },
    };
    const testStore = createAppStore();
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));
    expect(getFrequentLicensesNameOrder(testStore.getState())).toMatchObject(
      testFrequentLicenses.nameOrder,
    );
    expect(getFrequentLicensesTexts(testStore.getState())).toMatchObject(
      testFrequentLicenses.texts,
    );
  });

  it('sets and gets temporaryDisplayPackageInfo', () => {
    const testDisplayPackageInfo: PackageInfo = {
      packageName: 'test',
      packageVersion: '1.0',
      licenseText: 'License Text',
      id: faker.string.uuid(),
    };
    const testStore = createAppStore();
    testStore.dispatch(setTemporaryDisplayPackageInfo(testDisplayPackageInfo));
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toMatchObject(
      testDisplayPackageInfo,
    );
  });

  it('sets and gets baseUrlsForSources', () => {
    const testStore = createAppStore();
    expect(getBaseUrlsForSources(testStore.getState())).toEqual({});
    testStore.dispatch(setBaseUrlsForSources({ '/': 'github.com' }));
    expect(getBaseUrlsForSources(testStore.getState())).toEqual({
      '/': 'github.com',
    });
  });

  it('sets and gets externalAttributionSources', () => {
    const testStore = createAppStore();
    expect(getExternalAttributionSources(testStore.getState())).toEqual({});
    testStore.dispatch(
      setExternalAttributionSources({
        SC: { name: 'Scancode', priority: 1 },
      }),
    );
    expect(getExternalAttributionSources(testStore.getState())).toEqual({
      SC: { name: 'Scancode', priority: 1 },
    });
  });

  it('sets and gets isPreferenceFeatureEnabled', () => {
    const testStore = createAppStore();
    expect(getIsPreferenceFeatureEnabled(testStore.getState())).toBe(false);
    testStore.dispatch(setIsPreferenceFeatureEnabled(true));
    expect(getIsPreferenceFeatureEnabled(testStore.getState())).toBe(true);
  });
});
