// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  BaseUrlsForSources,
  FrequentLicences,
  PackageInfo,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { ProgressBarData } from '../../../../types/types';
import { getUpdatedProgressBarData } from '../../../helpers/progress-bar-data-helpers';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getExternalAttributionSources,
  getExternalData,
  getFilesWithChildren,
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
  getManualData,
  getProgressBarData,
  getResources,
} from '../../../selectors/all-views-resource-selectors';
import { getResolvedExternalAttributions } from '../../../selectors/audit-view-resource-selectors';
import { loadFromFile } from '../load-actions';
import { EMPTY_PROJECT_METADATA } from '../../../../shared-constants';
import { ATTRIBUTION_SOURCES } from '../../../../../shared/shared-constants';
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

describe('loadFromFile', () => {
  test('loads from file into state', () => {
    const testExternalAttributions: Attributions = {
      [testManualAttributionUuid_1]: {
        packageVersion: '1.0',
        packageName: 'test Package',
        licenseText: ' test License text',
        source: {
          name: 'Test document',
          documentConfidence: 99,
        },
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': ['uuid'],
      '/thirdParty/package_1.tr.gz': ['test_id'],
    };
    const testFrequentLicenses: FrequentLicences = {
      nameOrder: ['MIT', 'MIT license'],
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
      },
      externalAttributions: {
        attributions: testExternalAttributions,
        resourcesToAttributions: testResourcesToExternalAttributions,
      },
      frequentLicenses: testFrequentLicenses,
      resolvedExternalAttributions: new Set(['test_id']),
      attributionBreakpoints: new Set(['/third-party/package/']),
      filesWithChildren: new Set(['/third-party/package.json/']),
      baseUrlsForSources: testBaseUrlsForSources,
      externalAttributionSources: ATTRIBUTION_SOURCES,
    };
    const expectedResources: Resources = testResources;
    const expectedManualData: AttributionData = {
      attributions: testManualAttributions,
      resourcesToAttributions: testResourcesToManualAttributions,
      attributionsToResources: {
        '4d9f0b16-fbff-11ea-adc1-0242ac120002': ['/root/src/something.js'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set<string>().add('/root/src/something.js'),
        '/root/': new Set<string>().add('/root/src/something.js'),
        '/root/src/': new Set<string>().add('/root/src/something.js'),
      },
    };
    const expectedExternalData: AttributionData = {
      attributions: testExternalAttributions,
      resourcesToAttributions: testResourcesToExternalAttributions,
      attributionsToResources: {
        uuid: ['/root/src/something.js'],
        test_id: ['/thirdParty/package_1.tr.gz'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set<string>().add('/root/src/something.js'),
        '/root/': new Set<string>().add('/root/src/something.js'),
        '/root/src/': new Set<string>().add('/root/src/something.js'),
      },
    };
    const expectedProgressBarData: ProgressBarData = getUpdatedProgressBarData(
      testResources,
      testManualAttributions,
      testResourcesToManualAttributions,
      testResourcesToExternalAttributions,
      new Set<string>().add('test_id'),
      () => false,
      () => false
    );

    const testStore = createTestAppStore();
    expect(testStore.getState().resourceState).toMatchObject(
      initialResourceState
    );

    testStore.dispatch(loadFromFile(testParsedFileContent));
    expect(getResources(testStore.getState())).toEqual(expectedResources);
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getExternalData(testStore.getState())).toEqual(expectedExternalData);
    expect(getFrequentLicensesNameOrder(testStore.getState())).toEqual(
      testFrequentLicenses.nameOrder
    );
    expect(getFrequentLicensesTexts(testStore.getState())).toEqual(
      testFrequentLicenses.texts
    );
    expect(getProgressBarData(testStore.getState())).toEqual(
      expectedProgressBarData
    );
    expect(getResolvedExternalAttributions(testStore.getState())).toEqual(
      new Set(['test_id'])
    );
    expect(getAttributionBreakpoints(testStore.getState())).toEqual(
      new Set(['/third-party/package/'])
    );
    expect(getFilesWithChildren(testStore.getState())).toEqual(
      new Set(['/third-party/package.json/'])
    );

    expect(getBaseUrlsForSources(testStore.getState())).toEqual(
      testBaseUrlsForSources
    );
    expect(getExternalAttributionSources(testStore.getState())).toEqual(
      ATTRIBUTION_SOURCES
    );
  });
});
