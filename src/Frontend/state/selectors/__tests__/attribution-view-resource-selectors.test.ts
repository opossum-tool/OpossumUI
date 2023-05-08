// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import {
  setManualData,
  setResources,
} from '../../actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../actions/resource-actions/attribution-view-simple-actions';
import { getResourceIdsOfSelectedAttribution } from '../attribution-view-resource-selectors';

describe('The resource actions', () => {
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

  it('getResourceIdsForSelectedAttributionId returns correct Ids', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setResources(testResources));
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );

    expect(getResourceIdsOfSelectedAttribution(testStore.getState())).toEqual([
      '/root/src/something.js',
    ]);

    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_2));
    expect(
      getResourceIdsOfSelectedAttribution(testStore.getState())
    ).toBeNull();
  });
});
