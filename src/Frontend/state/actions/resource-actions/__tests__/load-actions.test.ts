// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  DiscreteConfidence,
  FrequentLicenses,
  PackageInfo,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { EMPTY_PROJECT_METADATA } from '../../../../shared-constants';
import { createAppStore } from '../../../configure-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getExternalAttributionSources,
  getExternalData,
  getFilesWithChildren,
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
  getIsPreferenceFeatureEnabled,
  getManualData,
  getResolvedExternalAttributions,
  getResources,
} from '../../../selectors/resource-selectors';
import { loadFromFile } from '../load-actions';

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
const testManualAttributionsToResources: AttributionsToResources = {
  [testManualAttributionUuid_1]: ['/root/src/something.js'],
};

describe('loadFromFile', () => {
  it('loads from file into state', () => {
    const testExternalAttributions: Attributions = {
      [testManualAttributionUuid_1]: {
        packageVersion: '1.0',
        packageName: 'test Package',
        licenseText: ' test License text',
        source: {
          name: 'Test document',
          documentConfidence: 99,
        },
        id: testManualAttributionUuid_1,
      },
      doNotChangeMe1: {
        packageName: 'name',
        comment: 'comment1',
        originIds: ['abc'],
        preSelected: true,
        attributionConfidence: 1,
        id: 'doNotChangeMe1',
      },
      doNotChangeMe2: {
        packageName: 'name',
        comment: 'comment2',
        originIds: ['def'],
        preSelected: false,
        attributionConfidence: 2,
        id: 'doNotChangeMe2',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': ['uuid'],
      '/thirdParty/package_1.tr.gz': [
        'test_id',
        'doNotChangeMe1',
        'doNotChangeMe2',
      ],
    };
    const testExternalAttributionsToResources: AttributionsToResources = {
      uuid: ['/root/src/something.js'],
      test_id: ['/thirdParty/package_1.tr.gz'],
      doNotChangeMe1: ['/thirdParty/package_1.tr.gz'],
      doNotChangeMe2: ['/thirdParty/package_1.tr.gz'],
    };
    const testFrequentLicenses: FrequentLicenses = {
      nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
      texts: {
        MIT: 'MIT license text',
        'MIT license': 'MIT license text',
      },
    };
    const testBaseUrlsForSources: BaseUrlsForSources = {
      '/': 'https://github.com/opossum-tool/opossumUI/',
    };

    const testParsedFileContent: ParsedFileContent = {
      metadata: EMPTY_PROJECT_METADATA,
      resources: testResources,
      manualAttributions: {
        attributions: testManualAttributions,
        resourcesToAttributions: testResourcesToManualAttributions,
        attributionsToResources: testManualAttributionsToResources,
      },
      externalAttributions: {
        attributions: testExternalAttributions,
        resourcesToAttributions: testResourcesToExternalAttributions,
        attributionsToResources: testExternalAttributionsToResources,
      },
      frequentLicenses: testFrequentLicenses,
      resolvedExternalAttributions: new Set(['test_id']),
      attributionBreakpoints: new Set(['/third-party/package/']),
      filesWithChildren: new Set(['/third-party/package.json/']),
      baseUrlsForSources: testBaseUrlsForSources,
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1, isRelevantForPreferred: true },
      },
    };
    const expectedResources: Resources = testResources;
    const expectedManualData: AttributionData = {
      attributions: testManualAttributions,
      resourcesToAttributions: testResourcesToManualAttributions,
      attributionsToResources: {
        '4d9f0b16-fbff-11ea-adc1-0242ac120002': ['/root/src/something.js'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          '1': new Set<number>().add(0),
          '2': new Set<number>().add(0),
          '3': new Set<number>().add(0),
        },
        pathsToIndices: {
          '/': 1,
          '/root/': 2,
          '/root/src/': 3,
          '/root/src/something.js': 0,
        },
        paths: ['/root/src/something.js', '/', '/root/', '/root/src/'],
      },
    };
    const expectedExternalData: AttributionData = {
      attributions: testExternalAttributions,
      resourcesToAttributions: testResourcesToExternalAttributions,
      attributionsToResources: {
        uuid: ['/root/src/something.js'],
        test_id: ['/thirdParty/package_1.tr.gz'],
        doNotChangeMe1: ['/thirdParty/package_1.tr.gz'],
        doNotChangeMe2: ['/thirdParty/package_1.tr.gz'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          '1': new Set<number>().add(0).add(4),
          '2': new Set<number>().add(0),
          '3': new Set<number>().add(0),
          '5': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 1,
          '/root/': 2,
          '/root/src/': 3,
          '/root/src/something.js': 0,
          '/thirdParty/': 5,
          '/thirdParty/package_1.tr.gz': 4,
        },
        paths: [
          '/root/src/something.js',
          '/',
          '/root/',
          '/root/src/',
          '/thirdParty/package_1.tr.gz',
          '/thirdParty/',
        ],
      },
    };

    const testStore = createAppStore();
    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState,
    );

    testStore.dispatch(loadFromFile(testParsedFileContent));
    expect(getResources(testStore.getState())).toEqual(expectedResources);
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getExternalData(testStore.getState())).toEqual(expectedExternalData);
    expect(getFrequentLicensesNameOrder(testStore.getState())).toEqual(
      testFrequentLicenses.nameOrder,
    );
    expect(getFrequentLicensesTexts(testStore.getState())).toEqual(
      testFrequentLicenses.texts,
    );
    expect(getResolvedExternalAttributions(testStore.getState())).toEqual(
      new Set(['test_id']),
    );
    expect(getAttributionBreakpoints(testStore.getState())).toEqual(
      new Set(['/third-party/package/']),
    );
    expect(getFilesWithChildren(testStore.getState())).toEqual(
      new Set(['/third-party/package.json/']),
    );

    expect(getBaseUrlsForSources(testStore.getState())).toEqual(
      testBaseUrlsForSources,
    );
    expect(getExternalAttributionSources(testStore.getState())).toEqual({
      SC: { name: 'ScanCode', priority: 1, isRelevantForPreferred: true },
    });
    expect(getIsPreferenceFeatureEnabled(testStore.getState())).toBe(true);
  });

  it('disables the preference feature if no external source is relevant', () => {
    const testFrequentLicenses: FrequentLicenses = {
      nameOrder: [],
      texts: {},
    };

    const testParsedFileContent: ParsedFileContent = {
      metadata: EMPTY_PROJECT_METADATA,
      resources: testResources,
      manualAttributions: {
        attributions: testManualAttributions,
        resourcesToAttributions: testResourcesToManualAttributions,
        attributionsToResources: testManualAttributionsToResources,
      },
      externalAttributions: {
        attributions: {},
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      frequentLicenses: testFrequentLicenses,
      resolvedExternalAttributions: new Set(),
      attributionBreakpoints: new Set(),
      filesWithChildren: new Set(),
      baseUrlsForSources: {},
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1, isRelevantForPreferred: false },
      },
    };

    const testStore = createAppStore();
    testStore.dispatch(loadFromFile(testParsedFileContent));

    expect(getIsPreferenceFeatureEnabled(testStore.getState())).toBe(false);
  });
});
