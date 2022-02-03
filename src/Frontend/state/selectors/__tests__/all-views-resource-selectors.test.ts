// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  PackageInfo,
  ProjectMetadata,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getIsFileWithChildren,
  getPackageInfoOfSelectedAttribution,
  getProjectMetadata,
  isAttributionBreakpoint,
} from '../all-views-resource-selectors';
import {
  setAttributionBreakpoints,
  setFilesWithChildren,
  setManualData,
  setProjectMetadata,
} from '../../actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../actions/resource-actions/attribution-view-simple-actions';
import { EMPTY_PROJECT_METADATA } from '../../../shared-constants';
import { DiscreteConfidence } from '../../../enums/enums';

describe('getPackageInfoOfSelectedAttribution', () => {
  const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
  const testTemporaryPackageInfo: PackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: testTemporaryPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  test('returns temporary package info of selected attribution', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toBe(
      testTemporaryPackageInfo
    );
  });

  test('returns empty temporary package info if no selected attribution', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions)
    );

    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      {}
    );
  });
});

describe('Attribution breakpoints', () => {
  const testAttributionBreakpoints: Set<string> = new Set([
    '/path/breakpoint/',
    '/node_modules/',
  ]);

  test('can be created, listed, and checked.', () => {
    const testStore = createTestAppStore();
    expect(getAttributionBreakpoints(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setAttributionBreakpoints(testAttributionBreakpoints));

    expect(getAttributionBreakpoints(testStore.getState())).toEqual(
      testAttributionBreakpoints
    );
    expect(
      isAttributionBreakpoint('/path/breakpoint/')(testStore.getState())
    ).toEqual(true);
    expect(
      isAttributionBreakpoint('/path/no-breakpoint/')(testStore.getState())
    ).toEqual(false);
  });
});

describe('Files with children', () => {
  const testFileWithChildren = '/package.json/';
  const testFilesWithChildren: Set<string> = new Set<string>().add(
    testFileWithChildren
  );

  test('can be created, listed and checked.', () => {
    const testStore = createTestAppStore();

    expect(getFilesWithChildren(testStore.getState())).toEqual(new Set());

    testStore.dispatch(setFilesWithChildren(testFilesWithChildren));

    expect(getFilesWithChildren(testStore.getState())).toEqual(
      testFilesWithChildren
    );
  });

  test('can get fileWithChildrenCheck', () => {
    const testStore = createTestAppStore();

    testStore.dispatch(setFilesWithChildren(testFilesWithChildren));

    const isFileWithChildren = getIsFileWithChildren(testStore.getState());
    expect(isFileWithChildren(testFileWithChildren)).toBe(true);
    expect(isFileWithChildren('/some_other_path')).toBe(false);
  });
});

describe('ProjectMetadata', () => {
  const testMetadata: ProjectMetadata = {
    projectTitle: 'Title',
    projectId: 'test-id',
    fileCreationDate: 'test-date',
  };

  test('can be set and get from store.', () => {
    const testStore = createTestAppStore();
    expect(getProjectMetadata(testStore.getState())).toEqual(
      EMPTY_PROJECT_METADATA
    );

    testStore.dispatch(setProjectMetadata(testMetadata));

    expect(getProjectMetadata(testStore.getState())).toEqual(testMetadata);
  });
});
