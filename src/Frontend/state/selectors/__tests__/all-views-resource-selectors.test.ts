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
  getDisplayPackageInfoOfSelected,
  getDisplayPackageInfoOfSelectedAttributionInAttributionView,
  getFilesWithChildren,
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
import { PanelPackage } from '../../../types/types';
import { PackagePanelTitle, View } from '../../../enums/enums';
import { setDisplayedPackage } from '../../actions/resource-actions/audit-view-simple-actions';
import { navigateToView } from '../../actions/view-actions/view-actions';

describe('getPackageInfoOfSelectedAttribution', () => {
  const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
  const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
    attributionConfidence: DiscreteConfidence.High,
    packageVersion: '1.0',
    packageName: 'test Package',
    licenseText: ' test License text',
    attributionIds: [testManualAttributionUuid_1],
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: convertDisplayPackageInfoToPackageInfo(
      testTemporaryDisplayPackageInfo,
    ),
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  it('returns temporary package info of selected attribution', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    expect(
      getDisplayPackageInfoOfSelectedAttributionInAttributionView(
        testStore.getState(),
      ),
    ).toEqual(testTemporaryDisplayPackageInfo);
  });

  it('returns empty temporary package info if no selected attribution', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );

    expect(
      getDisplayPackageInfoOfSelectedAttributionInAttributionView(
        testStore.getState(),
      ),
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
    const testStore = createTestAppStore();

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
    const testStore = createTestAppStore();
    expect(getProjectMetadata(testStore.getState())).toEqual(
      EMPTY_PROJECT_METADATA,
    );

    testStore.dispatch(setProjectMetadata(testMetadata));

    expect(getProjectMetadata(testStore.getState())).toEqual(testMetadata);
  });
});

describe('get displayPackageInfo', () => {
  it('gets displayPackageInfo from displayedPackagePanel for external attributions in AuditView', () => {
    const testDisplayedPackage: PanelPackage = {
      panel: PackagePanelTitle.ContainedExternalPackages,
      packageCardId: 'someId',
      displayPackageInfo: { packageName: 'React', attributionIds: ['uuid_0'] },
    };
    const testStore = createTestAppStore();
    testStore.dispatch(setDisplayedPackage(testDisplayedPackage));
    testStore.dispatch(navigateToView(View.Audit));
    const expectedDisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid_0'],
    };
    const testDisplayPackageInfo = getDisplayPackageInfoOfSelected(
      testStore.getState(),
    );
    expect(testDisplayPackageInfo).toEqual(expectedDisplayPackageInfo);
  });

  it('gets displayPackageInfo from displayedPackagePanel for manual attributions in AuditView', () => {
    const testDisplayedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      packageCardId: 'someId',
      displayPackageInfo: { packageName: 'React', attributionIds: ['uuid_0'] },
    };
    const testStore = createTestAppStore();
    testStore.dispatch(setDisplayedPackage(testDisplayedPackage));
    testStore.dispatch(navigateToView(View.Audit));
    const expectedDisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid_0'],
    };
    const testDisplayPackageInfo = getDisplayPackageInfoOfSelected(
      testStore.getState(),
    );
    expect(testDisplayPackageInfo).toEqual(expectedDisplayPackageInfo);
  });

  it('gets displayPackageInfo via selectedAttributionId in AttributionView', () => {
    const testSelectedAttributionId = 'uuid_0';
    const testManualAttributions: Attributions = {
      uuid_0: { packageName: 'React' },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      file: [testSelectedAttributionId],
    };
    const testStore = createTestAppStore();
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setSelectedAttributionId(testSelectedAttributionId));
    testStore.dispatch(navigateToView(View.Attribution));
    const expectedDisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid_0'],
    };
    const testDisplayPackageInfo = getDisplayPackageInfoOfSelected(
      testStore.getState(),
    );
    expect(testDisplayPackageInfo).toEqual(expectedDisplayPackageInfo);
  });
});
