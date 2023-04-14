// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  ProjectMetadata,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getDisplayPackageInfoOfSelectedAttribution,
  getProjectMetadata,
} from '../all-views-resource-selectors';
import {
  setAttributionBreakpoints,
  setFilesWithChildren,
  setManualData,
  setProjectMetadata,
} from '../../actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../actions/resource-actions/attribution-view-simple-actions';
import { EMPTY_PROJECT_METADATA } from '../../../shared-constants';
import { convertDisplayPackageInfoToPackageInfo } from '../../../util/convert-package-info';

describe('getPackageInfoOfSelectedAttribution', () => {
  const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
  const testTemporaryPackageInfo: DisplayPackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
    attributionIds: [testManualAttributionUuid_1],
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: convertDisplayPackageInfoToPackageInfo(
      testTemporaryPackageInfo
    ),
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  it('returns temporary package info of selected attribution', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    expect(
      getDisplayPackageInfoOfSelectedAttribution(testStore.getState())
    ).toEqual(testTemporaryPackageInfo);
  });

  it('returns empty temporary package info if no selected attribution', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );

    expect(
      getDisplayPackageInfoOfSelectedAttribution(testStore.getState())
    ).toBeNull();
  });
});

describe('Attribution breakpoints', () => {
  const testAttributionBreakpoints: Set<string> = new Set([
    '/path/breakpoint/',
    '/node_modules/',
  ]);

  it('can be created and listed.', () => {
    const testStore = createTestAppStore();
    expect(getAttributionBreakpoints(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setAttributionBreakpoints(testAttributionBreakpoints));

    expect(getAttributionBreakpoints(testStore.getState())).toEqual(
      testAttributionBreakpoints
    );
  });
});

describe('Files with children', () => {
  const testFileWithChildren = '/package.json/';
  const testFilesWithChildren: Set<string> = new Set<string>().add(
    testFileWithChildren
  );

  it('can be created, listed and checked.', () => {
    const testStore = createTestAppStore();

    expect(getFilesWithChildren(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setFilesWithChildren(testFilesWithChildren));

    expect(getFilesWithChildren(testStore.getState())).toEqual(
      testFilesWithChildren
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
    const testStore = createTestAppStore();
    expect(getProjectMetadata(testStore.getState())).toEqual(
      EMPTY_PROJECT_METADATA
    );

    testStore.dispatch(setProjectMetadata(testMetadata));

    expect(getProjectMetadata(testStore.getState())).toEqual(testMetadata);
  });
});
