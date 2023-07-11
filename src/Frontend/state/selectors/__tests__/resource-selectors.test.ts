// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import { wereTemporaryDisplayPackageInfoModified } from '../all-views-resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { PackagePanelTitle } from '../../../enums/enums';
import {
  setDisplayedPackage,
  setSelectedResourceId,
} from '../../actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import {
  setManualData,
  setTemporaryDisplayPackageInfo,
} from '../../actions/resource-actions/all-views-simple-actions';

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
  const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
    attributionIds: [],
  };
  const secondTestTemporaryDisplayPackageInfo: DisplayPackageInfo = {
    packageVersion: '2.0',
    packageName: 'not assigned test Package',
    licenseText: ' test not assigned License text',
    attributionIds: [],
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
    [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  it('returns true  when TemporaryDisplayPackageInfo have been modified', () => {
    const testStore = createTestAppStore();
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
    const testStore = createTestAppStore();
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

  it('returns false when only confidence is set and true when attribution is created', () => {
    const testStore = createTestAppStore();
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
        attributionIds: [],
      }),
    );
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
    const testStore = createTestAppStore();
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
