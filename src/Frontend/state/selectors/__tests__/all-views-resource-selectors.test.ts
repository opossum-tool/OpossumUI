// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { PackagePanelTitle, View } from '../../../enums/enums';
import { EMPTY_PROJECT_METADATA } from '../../../shared-constants';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import { PanelPackage } from '../../../types/types';
import { convertDisplayPackageInfoToPackageInfo } from '../../../util/convert-package-info';
import {
  setAttributionBreakpoints,
  setFilesWithChildren,
  setManualData,
  setProjectMetadata,
  setResources,
} from '../../actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../actions/resource-actions/attribution-view-simple-actions';
import { setDisplayedPackage } from '../../actions/resource-actions/audit-view-simple-actions';
import { navigateToView } from '../../actions/view-actions/view-actions';
import {
  getAttributionBreakpoints,
  getDisplayPackageInfoOfSelected,
  getDisplayPackageInfoOfSelectedAttributionInAttributionView,
  getFilesWithChildren,
  getProjectMetadata,
  getResourceIdsOfSelectedAttribution,
} from '../all-views-resource-selectors';

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
  const testSelectedPackage: PanelPackage = {
    panel: PackagePanelTitle.ManualPackages,
    packageCardId: 'Attributions-0',
    displayPackageInfo: {
      ...testTemporaryDisplayPackageInfo,
      attributionIds: [testManualAttributionUuid_1],
    },
  };
  const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
    packageVersion: '2.0',
    packageName: 'not assigned test Package',
    licenseText: ' test not assigned License text',
  };
  const secondTestSelectedPackage: PanelPackage = {
    panel: PackagePanelTitle.ManualPackages,
    packageCardId: 'Attributions-1',
    displayPackageInfo: {
      ...secondTestTemporaryDisplayPackageInfo,
      attributionIds: [testManualAttributionUuid_2],
    },
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
    [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
  };
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/root/src/something.js': [testManualAttributionUuid_1],
  };

  it('getResourceIdsForSelectedAttributionId returns correct Ids in Audit View', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setResources(testResources));
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setDisplayedPackage(testSelectedPackage));

    expect(getResourceIdsOfSelectedAttribution(testStore.getState())).toEqual([
      '/root/src/something.js',
    ]);

    testStore.dispatch(setDisplayedPackage(secondTestSelectedPackage));
    expect(
      getResourceIdsOfSelectedAttribution(testStore.getState()),
    ).toBeNull();
  });

  it('getResourceIdsForSelectedAttributionId returns correct Ids in Attribution View', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(setResources(testResources));
    testStore.dispatch(
      setManualData(testManualAttributions, testResourcesToManualAttributions),
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));

    expect(getResourceIdsOfSelectedAttribution(testStore.getState())).toEqual([
      '/root/src/something.js',
    ]);

    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_2));
    expect(
      getResourceIdsOfSelectedAttribution(testStore.getState()),
    ).toBeNull();
  });
});
