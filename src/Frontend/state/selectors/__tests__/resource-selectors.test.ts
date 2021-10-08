// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import { wereTemporaryPackageInfoModified } from '../all-views-resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/test-helpers';
import { PackagePanelTitle } from '../../../enums/enums';
import {
  setDisplayedPackage,
  setSelectedResourceId,
} from '../../actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import {
  setManualData,
  setTemporaryPackageInfo,
} from '../../actions/resource-actions/all-views-simple-actions';

describe('getWerePackageInfoModified', () => {
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
    attributionConfidence: 80,
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

  test('returns true  when TemporaryPackageInfo have been modified', () => {
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
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);
  });

  test('returns true  when confidence is changed', () => {
    const testStore = createTestAppStore();
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: 20,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);
  });

  test('returns false when only confidence is set and true when attribution is created', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(getParsedInputFileEnrichedWithTestData(testResources))
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
    testStore.dispatch(setTemporaryPackageInfo({ attributionConfidence: 20 }));
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
    testStore.dispatch(
      setTemporaryPackageInfo({
        attributionConfidence: 20,
        packageName: 'test Package',
      })
    );
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);
  });

  test('returns false when TemporaryPackageInfo have not been modified', () => {
    const testStore = createTestAppStore();
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: 80,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        attributionId: testManualAttributionUuid_1,
      })
    );
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
  });
});
