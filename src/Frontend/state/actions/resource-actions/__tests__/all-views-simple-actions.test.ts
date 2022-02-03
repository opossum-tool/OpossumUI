// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  AttributionsToResources,
  FrequentLicences,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../../shared/shared-types';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { ProgressBarData } from '../../../../types/types';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getBaseUrlsForSources,
  getExternalAttributions,
  getExternalAttributionSources,
  getExternalAttributionsToResources,
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
  getIsSavingDisabled,
  getManualAttributions,
  getManualAttributionsToResources,
  getProgressBarData,
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
  setExternalData,
  setFrequentLicences,
  setManualData,
  setProgressBarData,
  setResources,
  setTemporaryPackageInfo,
} from '../all-views-simple-actions';
import { setSelectedResourceId } from '../audit-view-simple-actions';
import { loadFromFile } from '../load-actions';
import { setIsSavingDisabled } from '../save-actions';
import { DiscreteConfidence } from '../../../../enums/enums';

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
  test('resets the state', () => {
    const testStore = createTestAppStore();
    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
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

  test('sets and gets resources', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setResources(testResources));
    expect(getResources(testStore.getState())).toMatchObject(testResources);
  });

  test('sets and gets manual attribution data', () => {
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
        '/': new Set<string>().add('/some/path1').add('/some/path2'),
        '/some/': new Set<string>().add('/some/path1').add('/some/path2'),
      };

    const testStore = createTestAppStore();
    expect(getManualAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({});
    expect(getManualAttributionsToResources(testStore.getState())).toEqual({});
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual({});

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

  test('sets and gets external attribution data', () => {
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
        '/': new Set<string>().add('/some/path1').add('/some/path2'),
        '/some/': new Set<string>().add('/some/path1').add('/some/path2'),
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
    ).toEqual({});

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

  test('sets and gets frequentLicenses', () => {
    const testFrequentLicenses: FrequentLicences = {
      nameOrder: ['MIT', 'GPL'],
      texts: { MIT: 'MIT text', GPL: 'GPL text' },
    };
    const testStore = createTestAppStore();
    testStore.dispatch(setFrequentLicences(testFrequentLicenses));
    expect(getFrequentLicensesNameOrder(testStore.getState())).toMatchObject(
      testFrequentLicenses.nameOrder
    );
    expect(getFrequentLicensesTexts(testStore.getState())).toMatchObject(
      testFrequentLicenses.texts
    );
  });

  test('sets and gets progressBarData', () => {
    const testResources: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file1: 1, file2: 1 },
      folder3: { file1: 1, file2: 1 },
      file1: 1,
      file2: 1,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': ['uuid1'],
      '/folder2/file1': ['uuid1'],
      '/file1': ['uuid1'],
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file2': ['uuid2'],
      '/folder2/file2': ['uuid2'],
      '/folder3/': ['uuid3'],
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
      },
    };
    const testExternalAttributions: Attributions = {
      uuid2: {
        comment: 'This could be React.',
      },
      uuid3: {
        url: 'https://reactjs.org/',
      },
    };
    const expectedProgressBarData: ProgressBarData = {
      fileCount: 8,
      filesWithManualAttributionCount: 4,
      filesWithOnlyExternalAttributionCount: 3,
      filesWithOnlyPreSelectedAttributionCount: 0,
      resourcesWithNonInheritedSignalOnly: ['/folder2/file2', '/folder3/'],
    };

    const testStore = createTestAppStore();
    expect(getProgressBarData(testStore.getState())).toBeNull();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );

    testStore.dispatch(
      setProgressBarData(
        testResources,
        testManualAttributions,
        testResourcesToManualAttributions,
        testResourcesToExternalAttributions,
        new Set<string>().add('resolved')
      )
    );
    expect(getProgressBarData(testStore.getState())).toEqual(
      expectedProgressBarData
    );
  });

  test('sets and gets temporaryPackageInfo', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'test',
      packageVersion: '1.0',
      licenseText: 'License Text',
    };
    const testStore = createTestAppStore();
    testStore.dispatch(setTemporaryPackageInfo(testPackageInfo));
    expect(getTemporaryPackageInfo(testStore.getState())).toMatchObject(
      testPackageInfo
    );
  });

  test('sets and gets isSavingDisabled', () => {
    const testStore = createTestAppStore();
    expect(getIsSavingDisabled(testStore.getState())).toBe(false);
    testStore.dispatch(setIsSavingDisabled(true));
    expect(getIsSavingDisabled(testStore.getState())).toBe(true);
  });

  test('sets and gets baseUrlsForSources', () => {
    const testStore = createTestAppStore();
    expect(getBaseUrlsForSources(testStore.getState())).toEqual({});
    testStore.dispatch(setBaseUrlsForSources({ '/': 'github.com' }));
    expect(getBaseUrlsForSources(testStore.getState())).toEqual({
      '/': 'github.com',
    });
  });

  test('sets and gets externalAttributionSources', () => {
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
});
