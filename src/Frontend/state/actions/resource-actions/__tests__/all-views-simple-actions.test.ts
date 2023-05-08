// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  AttributionsToResources,
  DiscreteConfidence,
  DisplayPackageInfo,
  FrequentLicenses,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../../shared/shared-types';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getBaseUrlsForSources,
  getExternalAttributions,
  getExternalAttributionSources,
  getExternalAttributionsToResources,
  getExternalAttributionsToHashes,
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
  getIsSavingDisabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
  getTemporaryPackageInfo,
} from '../../../selectors/all-views-resource-selectors';
import {
  resetResourceState,
  setBaseUrlsForSources,
  setExternalAttributionSources,
  setExternalAttributionsToHashes,
  setExternalData,
  setFrequentLicenses,
  setManualData,
  setResources,
  setTemporaryPackageInfo,
} from '../all-views-simple-actions';
import { setSelectedResourceId } from '../audit-view-simple-actions';
import { setIsSavingDisabled } from '../save-actions';

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
const testTemporaryPackageInfo: PackageInfo = {
  attributionConfidence: DiscreteConfidence.High,
  packageVersion: '1.0',
  packageName: 'test Package',
  licenseText: ' test License text',
};
const secondTestTemporaryPackageInfo: PackageInfo = {
  packageVersion: '2.0',
  packageName: 'not assigned test Package',
  licenseText: ' test not assigned License text',
};
const testManualAttributions: Attributions = {
  [testManualAttributionUuid_1]: testTemporaryPackageInfo,
  [testManualAttributionUuid_2]: secondTestTemporaryPackageInfo,
};
const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/root/src/something.js': [testManualAttributionUuid_1],
};

describe('The load and navigation simple actions', () => {
  it('resets the state', () => {
    const testStore = createTestAppStore();
    const testTemporaryPackageInfo: DisplayPackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionIds: [],
    };
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    testStore.dispatch(resetResourceState());

    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState
    );
  });

  it('sets and gets resources', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setResources(testResources));
    expect(getResources(testStore.getState())).toMatchObject(testResources);
  });

  it('sets and gets manual attribution data', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React' },
      uuid2: { packageName: 'Redux' },
    };
    const testResourcesToAttributions: ResourcesToAttributions = {
      '/some/path1': ['uuid1', 'uuid2'],
      '/some/path2': ['uuid1'],
    };
    const expectedAttributionsToResources: AttributionsToResources = {
      uuid1: ['/some/path1', '/some/path2'],
      uuid2: ['/some/path1'],
    };
    const expectedResourcesWithAttributedChildren: ResourcesWithAttributedChildren =
      {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(0).add(3),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
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

    const testStore = createTestAppStore();
    expect(getManualAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({});
    expect(getManualAttributionsToResources(testStore.getState())).toEqual({});
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });

    testStore.dispatch(
      setManualData(testAttributions, testResourcesToAttributions)
    );
    expect(getManualAttributions(testStore.getState())).toEqual(
      testAttributions
    );
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual(
      testResourcesToAttributions
    );
    expect(getManualAttributionsToResources(testStore.getState())).toEqual(
      expectedAttributionsToResources
    );
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual(expectedResourcesWithAttributedChildren);
  });

  it('sets and gets external attribution data', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React' },
      uuid2: { packageName: 'Redux' },
    };
    const testResourcesToAttributions: ResourcesToAttributions = {
      '/some/path1': ['uuid1', 'uuid2'],
      '/some/path2': ['uuid1'],
    };
    const expectedAttributionsToResources: AttributionsToResources = {
      uuid1: ['/some/path1', '/some/path2'],
      uuid2: ['/some/path1'],
    };
    const expectedResourcesWithAttributedChildren: ResourcesWithAttributedChildren =
      {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(0).add(3),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
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

    const testStore = createTestAppStore();
    expect(getExternalAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToExternalAttributions(testStore.getState())).toEqual(
      {}
    );
    expect(getExternalAttributionsToResources(testStore.getState())).toEqual(
      {}
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });

    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions)
    );
    expect(getExternalAttributions(testStore.getState())).toEqual(
      testAttributions
    );
    expect(getResourcesToExternalAttributions(testStore.getState())).toEqual(
      testResourcesToAttributions
    );
    expect(getExternalAttributionsToResources(testStore.getState())).toEqual(
      expectedAttributionsToResources
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
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
    const testStore = createTestAppStore();
    testStore.dispatch(setFrequentLicenses(testFrequentLicenses));
    expect(getFrequentLicensesNameOrder(testStore.getState())).toMatchObject(
      testFrequentLicenses.nameOrder
    );
    expect(getFrequentLicensesTexts(testStore.getState())).toMatchObject(
      testFrequentLicenses.texts
    );
  });

  it('sets and gets temporaryPackageInfo', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'test',
      packageVersion: '1.0',
      licenseText: 'License Text',
      attributionIds: [],
    };
    const testStore = createTestAppStore();
    testStore.dispatch(setTemporaryPackageInfo(testDisplayPackageInfo));
    expect(getTemporaryPackageInfo(testStore.getState())).toMatchObject(
      testDisplayPackageInfo
    );
  });

  it('sets and gets isSavingDisabled', () => {
    const testStore = createTestAppStore();
    expect(getIsSavingDisabled(testStore.getState())).toBe(false);
    testStore.dispatch(setIsSavingDisabled(true));
    expect(getIsSavingDisabled(testStore.getState())).toBe(true);
  });

  it('sets and gets baseUrlsForSources', () => {
    const testStore = createTestAppStore();
    expect(getBaseUrlsForSources(testStore.getState())).toEqual({});
    testStore.dispatch(setBaseUrlsForSources({ '/': 'github.com' }));
    expect(getBaseUrlsForSources(testStore.getState())).toEqual({
      '/': 'github.com',
    });
  });

  it('sets and gets externalAttributionSources', () => {
    const testStore = createTestAppStore();
    expect(getExternalAttributionSources(testStore.getState())).toEqual({});
    testStore.dispatch(
      setExternalAttributionSources({
        SC: { name: 'Scancode', priority: 1 },
      })
    );
    expect(getExternalAttributionSources(testStore.getState())).toEqual({
      SC: { name: 'Scancode', priority: 1 },
    });
  });

  it('sets and gets externalAttributionsToHashes', () => {
    const testExternalAttributionsToHashes = { uuid: '0123-4567' };
    const testStore = createTestAppStore();
    testStore.dispatch(
      setExternalAttributionsToHashes(testExternalAttributionsToHashes)
    );
    expect(getExternalAttributionsToHashes(testStore.getState())).toEqual(
      testExternalAttributionsToHashes
    );
  });
});
