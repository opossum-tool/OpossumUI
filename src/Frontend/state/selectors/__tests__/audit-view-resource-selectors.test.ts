// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { getAttributionsToResources } from '../../../test-helpers/general-test-helpers';
import { setManualData } from '../../actions/resource-actions/all-views-simple-actions';
import {
  setResolvedExternalAttributions,
  setSelectedAttributionId,
} from '../../actions/resource-actions/audit-view-simple-actions';
import { createAppStore } from '../../configure-store';
import {
  getPackageInfoOfSelectedAttribution,
  getResolvedExternalAttributions,
} from '../resource-selectors';

describe('The audit view resource selectors', () => {
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
  const testAttributionsToResources = getAttributionsToResources(
    testResourcesToManualAttributions,
  );

  it('sets Attributions and getsAttribution for a ResourceId', () => {
    const testStore = createAppStore();
    const expectedDisplayPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      id: testManualAttributionUuid_1,
    };
    expect(
      getPackageInfoOfSelectedAttribution(testStore.getState()),
    ).toBeNull();

    testStore.dispatch(
      setManualData(
        testManualAttributions,
        testResourcesToManualAttributions,
        testAttributionsToResources,
      ),
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      expectedDisplayPackageInfo,
    );
  });

  it('sets and gets resolvedExternalAttributions', () => {
    const testStore = createAppStore();
    const testResolvedExternalAttributions: Set<string> = new Set();
    testResolvedExternalAttributions
      .add('d3a753c0-5100-11eb-ae93-0242ac130002')
      .add('d3a7565e-5100-11eb-ae93-0242ac130002');

    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      new Set(),
    );

    testStore.dispatch(
      setResolvedExternalAttributions(testResolvedExternalAttributions),
    );
    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      testResolvedExternalAttributions,
    );
  });
});
