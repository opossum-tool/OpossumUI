// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { PackagePanelTitle } from '../../../enums/enums';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  setManualData,
  setTemporaryDisplayPackageInfo,
} from '../../actions/resource-actions/all-views-simple-actions';
import {
  setDisplayedPackage,
  setSelectedResourceId,
} from '../../actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { createAppStore } from '../../configure-store';
import { wereTemporaryDisplayPackageInfoModified } from '../all-views-resource-selectors';

describe('wereTemporaryDisplayPackageInfoModified', () => {
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
  };
  const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
    packageVersion: '2.0',
    packageName: 'not assigned test Package',
    licenseText: ' test not assigned License text',
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
    [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  it('returns true  when TemporaryDisplayPackageInfo have been modified', () => {
    const testStore = createAppStore();
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionIds: [],
    };
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      false,
    );
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );

    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      true,
    );
  });

  it('returns true  when confidence is changed', () => {
    const testStore = createAppStore();
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionIds: [],
    };
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      false,
    );
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );

    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      true,
    );
  });

  it('returns true when attribution is created', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(getParsedInputFileEnrichedWithTestData(testResources)),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      false,
    );
    testStore.dispatch(
      setTemporaryDisplayPackageInfo({
        attributionConfidence: DiscreteConfidence.Low,
        packageName: 'test Package',
        attributionIds: [],
      }),
    );
    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      true,
    );
  });

  it('returns false when TemporaryDisplayPackageInfo have not been modified', () => {
    const testStore = createAppStore();
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionIds: [testManualAttributionUuid_1],
    };
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        packageCardId: 'Attributions-0',
        displayPackageInfo: testTemporaryDisplayPackageInfo,
      }),
    );
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );

    expect(wereTemporaryDisplayPackageInfoModified(testStore.getState())).toBe(
      false,
    );
  });
});
