// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Attributions,
  Criticality,
  DiscreteConfidence,
  type PackageInfo,
  type ResourcesToAttributions,
  type ResourcesWithAttributedChildren,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { getAttributionsToResources } from '../../../../test-helpers/general-test-helpers';
import { createAppStore } from '../../../configure-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getBaseUrlsForSources,
  getExternalAttributionSources,
  getIsPreferenceFeatureEnabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getResourcesToManualAttributions,
  getResourcesWithManualAttributedChildren,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/resource-selectors';
import {
  resetResourceState,
  setBaseUrlsForSources,
  setExternalAttributionSources,
  setIsPreferenceFeatureEnabled,
  setManualData,
  setTemporaryDisplayPackageInfo,
} from '../all-views-simple-actions';
import { setSelectedResourceId } from '../audit-view-simple-actions';

const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
const testTemporaryDisplayPackageInfo: PackageInfo = {
  attributionConfidence: DiscreteConfidence.High,
  packageVersion: '1.0',
  packageName: 'test Package',
  licenseText: ' test License text',
  criticality: Criticality.None,
  id: testManualAttributionUuid_1,
};
const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
  packageVersion: '2.0',
  packageName: 'not assigned test Package',
  licenseText: ' test not assigned License text',
  criticality: Criticality.None,
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
      criticality: Criticality.None,
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

  it('sets and gets manual attribution data', () => {
    const testAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        criticality: Criticality.None,
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        criticality: Criticality.None,
        id: 'uuid2',
      },
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

  it('sets and gets temporaryDisplayPackageInfo', () => {
    const testDisplayPackageInfo: PackageInfo = {
      packageName: 'test',
      packageVersion: '1.0',
      licenseText: 'License Text',
      criticality: Criticality.None,
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
