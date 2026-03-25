// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AttributionData,
  type Attributions,
  type AttributionsToResources,
  type BaseUrlsForSources,
  Criticality,
  DiscreteConfidence,
  type PackageInfo,
  type ParsedFrontendFileContent,
  type ProjectConfig,
  type RawProjectConfig,
  type ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { EMPTY_PROJECT_METADATA } from '../../../../shared-constants';
import { OpossumColors } from '../../../../shared-styles';
import { createAppStore } from '../../../configure-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getClassifications,
  getExternalAttributionSources,
  getFilesWithChildren,
  getIsPreferenceFeatureEnabled,
  getManualData,
  getResolvedExternalAttributions,
} from '../../../selectors/resource-selectors';
import { loadFromFile } from '../load-actions';

const testConfig: RawProjectConfig = {
  classifications: {
    0: faker.word.words(),
    1: faker.word.words(),
  },
};

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
const testManualAttributionsToResources: AttributionsToResources = {
  [testManualAttributionUuid_1]: ['/root/src/something.js'],
};

describe('loadFromFile', () => {
  it('loads from file into state', () => {
    const testBaseUrlsForSources: BaseUrlsForSources = {
      '/': 'https://github.com/opossum-tool/opossumUI/',
    };

    const testParsedFileContent: ParsedFrontendFileContent = {
      metadata: EMPTY_PROJECT_METADATA,
      config: testConfig,
      manualAttributions: {
        attributions: testManualAttributions,
        resourcesToAttributions: testResourcesToManualAttributions,
        attributionsToResources: testManualAttributionsToResources,
      },
      resolvedExternalAttributions: new Set(['test_id']),
      attributionBreakpoints: new Set(['/third-party/package/']),
      filesWithChildren: new Set(['/third-party/package.json/']),
      baseUrlsForSources: testBaseUrlsForSources,
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1, isRelevantForPreferred: true },
      },
    };
    const expectedConfig: ProjectConfig = {
      classifications: {
        0: {
          description: testConfig.classifications[0],
          color: OpossumColors.pastelLightGreen,
        },
        1: {
          description: testConfig.classifications[1],
          color: '#ff0000',
        },
      },
    };
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

    const testStore = createAppStore();
    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState,
    );

    testStore.dispatch(loadFromFile(testParsedFileContent));
    expect(getClassifications(testStore.getState())).toEqual(
      expectedConfig.classifications,
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
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
    const testParsedFileContent: ParsedFrontendFileContent = {
      metadata: EMPTY_PROJECT_METADATA,
      config: testConfig,
      manualAttributions: {
        attributions: testManualAttributions,
        resourcesToAttributions: testResourcesToManualAttributions,
        attributionsToResources: testManualAttributionsToResources,
      },
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
