// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  BaseUrlsForSources,
  DiscreteConfidence,
  FrequentLicenses,
  PackageInfo,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { initialResourceState } from '../../../reducers/resource-reducer';
import {
  getAttributionBreakpoints,
  getBaseUrlsForSources,
  getExternalAttributionSources,
  getExternalAttributionsToHashes,
  getExternalData,
  getFilesWithChildren,
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
  getManualData,
  getResources,
} from '../../../selectors/all-views-resource-selectors';
import { getResolvedExternalAttributions } from '../../../selectors/audit-view-resource-selectors';
import { loadFromFile } from '../load-actions';
import { EMPTY_PROJECT_METADATA } from '../../../../shared-constants';

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
      },
      doNotChangeMe1: {
        packageName: 'name',
        comment: 'comment1',
        originIds: ['abc'],
        preSelected: true,
        attributionConfidence: 1,
      },
      doNotChangeMe2: {
        packageName: 'name',
        comment: 'comment2',
        originIds: ['def'],
        preSelected: false,
        attributionConfidence: 2,
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': ['uuid'],
      '/thirdParty/package_1.tr.gz': ['test_id'],
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
      externalAttributionSources: { SC: { name: 'ScanCode', priority: 1 } },
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
    const expectedExternalAttributionsToHashes: AttributionsToHashes = {
      doNotChangeMe1: '9263f76013801519989b1ba42aa42825de74ad93',
      doNotChangeMe2: '9263f76013801519989b1ba42aa42825de74ad93',
    };

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
    expect(getExternalAttributionSources(testStore.getState())).toEqual({
      SC: { name: 'ScanCode', priority: 1 },
    });
    expect(getExternalAttributionsToHashes(testStore.getState())).toEqual(
      expectedExternalAttributionsToHashes
    );
  });
});
