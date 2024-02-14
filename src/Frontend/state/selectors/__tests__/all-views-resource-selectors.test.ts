// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { View } from '../../../enums/enums';
import { EMPTY_PROJECT_METADATA } from '../../../shared-constants';
import { getAttributionsToResources } from '../../../test-helpers/general-test-helpers';
import {
  setAttributionBreakpoints,
  setFilesWithChildren,
  setManualData,
  setProjectMetadata,
  setResources,
} from '../../actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../actions/resource-actions/audit-view-simple-actions';
import { navigateToView } from '../../actions/view-actions/view-actions';
import { createAppStore } from '../../configure-store';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getPackageInfoOfSelectedAttribution,
  getProjectMetadata,
  getResourceIdsOfSelectedAttribution,
} from '../resource-selectors';

describe('getPackageInfoOfSelectedAttribution', () => {
  const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
  const testTemporaryDisplayPackageInfo: PackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
    id: testManualAttributionUuid_1,
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };
  const testAttributionsToResources = getAttributionsToResources(
    testResourcesToManualAttributions,
  );

  it('returns temporary package info of selected attribution', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setManualData(
        testManualAttributions,
        testResourcesToManualAttributions,
        testAttributionsToResources,
      ),
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      testTemporaryDisplayPackageInfo,
    );
  });

  it('returns empty temporary package info if no selected attribution', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      setManualData(
        testManualAttributions,
        testResourcesToManualAttributions,
        testAttributionsToResources,
      ),
    );

    expect(
      getPackageInfoOfSelectedAttribution(testStore.getState()),
    ).toBeNull();
  });
});

describe('Attribution breakpoints', () => {
  const testAttributionBreakpoints: Set<string> = new Set([
    '/path/breakpoint/',
    '/node_modules/',
  ]);

  it('can be created and listed.', () => {
    const testStore = createAppStore();
    expect(getAttributionBreakpoints(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setAttributionBreakpoints(testAttributionBreakpoints));

    expect(getAttributionBreakpoints(testStore.getState())).toEqual(
      testAttributionBreakpoints,
    );
  });
});

describe('Files with children', () => {
  const testFileWithChildren = '/package.json/';
  const testFilesWithChildren: Set<string> = new Set<string>().add(
    testFileWithChildren,
  );

  it('can be created, listed and checked.', () => {
    const testStore = createAppStore();

    expect(getFilesWithChildren(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setFilesWithChildren(testFilesWithChildren));

    expect(getFilesWithChildren(testStore.getState())).toEqual(
      testFilesWithChildren,
    );
  });
});

describe('ProjectMetadata', () => {
  const testMetadata: ProjectMetadata = {
    projectTitle: 'Title',
    projectId: 'test-id',
    fileCreationDate: 'test-date',
  };

  it('can be set and get from store.', () => {
    const testStore = createAppStore();
    expect(getProjectMetadata(testStore.getState())).toEqual(
      EMPTY_PROJECT_METADATA,
    );

    testStore.dispatch(setProjectMetadata(testMetadata));

    expect(getProjectMetadata(testStore.getState())).toEqual(testMetadata);
  });
});

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
  const testPackageInfo: PackageInfo = {
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
    [testManualAttributionUuid_1]: testPackageInfo,
    [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };
  const testAttributionsToResources = getAttributionsToResources(
    testResourcesToManualAttributions,
  );

  it('getResourceIdsOfSelectedAttribution returns correct ids', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setResources(testResources));
    testStore.dispatch(
      setManualData(
        testManualAttributions,
        testResourcesToManualAttributions,
        testAttributionsToResources,
      ),
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));

    expect(getResourceIdsOfSelectedAttribution(testStore.getState())).toEqual([
      '/root/src/something.js',
    ]);

    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_2));
    expect(getResourceIdsOfSelectedAttribution(testStore.getState())).toEqual(
      [],
    );
  });
});
