// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { PackagePanelTitle, View } from '../../../../enums/enums';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { PanelPackage } from '../../../../types/types';
import {
  getManualData,
  getTemporaryPackageInfo,
} from '../../../selectors/all-views-resource-selectors';
import {
  openResourceInResourceBrowser,
  resetTemporaryPackageInfo,
  setDisplayedPackageAndResetTemporaryPackageInfo,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../navigation-actions';
import { savePackageInfo } from '../save-actions';
import { navigateToView, setTargetView } from '../../view-actions/view-actions';
import { getSelectedView } from '../../../selectors/view-selector';
import { IpcRenderer } from 'electron';
import {
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from '../attribution-view-simple-actions';
import {
  setDisplayedPackage,
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../audit-view-simple-actions';
import { loadFromFile } from '../load-actions';
import { setTemporaryPackageInfo } from '../all-views-simple-actions';
import {
  getDisplayedPackage,
  getExpandedIds,
  getSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import { getSelectedAttributionId } from '../../../selectors/attribution-view-resource-selectors';

describe('resetTemporaryPackageInfo', () => {
  test('works correctly on audit', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
    };
    const testResources: Resources = {
      file: 1,
    };
    const testManualAttributions: Attributions = {
      uuid1: testReact,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file': ['uuid1'],
    };
    const initialSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: 'uuid1',
    };
    const initialTemporaryPackageInfo: PackageInfo = {
      packageName: 'Vue',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setSelectedResourceId('/file'));
    testStore.dispatch(setDisplayedPackage(initialSelectedPackage));
    testStore.dispatch(setTemporaryPackageInfo(initialTemporaryPackageInfo));
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      initialTemporaryPackageInfo
    );

    testStore.dispatch(resetTemporaryPackageInfo());
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(testReact);
  });

  test('works correctly on attribution view', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
    };
    const testManualAttributions: Attributions = {
      uuid1: testReact,
    };
    const initialTemporaryPackageInfo: PackageInfo = {
      packageName: 'Vue',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        })
      )
    );
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(setSelectedAttributionId('uuid1'));
    testStore.dispatch(setTemporaryPackageInfo(initialTemporaryPackageInfo));
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      initialTemporaryPackageInfo
    );

    testStore.dispatch(resetTemporaryPackageInfo());
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(testReact);
  });
});

describe('setSelectedResourceOrAttributionIdFromTarget', () => {
  test('setSelectedResourceId in case of Audit View', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setSelectedResourceId('previousResourceId'));
    testStore.dispatch(setSelectedAttributionId('previousAttributionId'));
    testStore.dispatch(setTargetSelectedResourceId('newResourceId'));

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getSelectedResourceId(state)).toBe('newResourceId');
    expect(getSelectedAttributionId(state)).toBe('previousAttributionId');
  });

  test('setSelectedAttributionId in case of attribution view and targetView Resource', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(setTargetView(View.Audit));
    testStore.dispatch(setSelectedResourceId('previousResourceId'));
    testStore.dispatch(setSelectedAttributionId('previousAttributionId'));
    testStore.dispatch(setTargetSelectedAttributionId('newAttributionId'));
    testStore.dispatch(setTargetSelectedResourceId('newResourceId'));
    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Attribution);
    expect(getSelectedResourceId(state)).toBe('newResourceId');
    expect(getSelectedAttributionId(state)).toBe('newAttributionId');
  });

  test('setSelectedAttributionId in case of attribution view and stay on attribution view', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(setTargetView(View.Attribution));
    testStore.dispatch(setSelectedResourceId('previousResourceId'));
    testStore.dispatch(setSelectedAttributionId('previousAttributionId'));
    testStore.dispatch(setTargetSelectedAttributionId('newAttributionId'));
    testStore.dispatch(setTargetSelectedResourceId('newResourceId'));

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Attribution);
    expect(getSelectedResourceId(state)).toBe('previousResourceId');
    expect(getSelectedAttributionId(state)).toBe('newAttributionId');
  });
});

describe('setSelectedResourceIdAndExpand', () => {
  test('sets the selectedResourceId', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getSelectedResourceId(state)).toBe('/folder1/folder2/test');
    expect(getSelectedView(state)).toEqual(View.Audit);
  });

  test('sets the expandedIds', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getExpandedIds(state)).toMatchObject([
      '/',
      '/folder1/',
      '/folder1/folder2/',
      '/folder1/folder2/test',
    ]);
  });
});

describe('setDisplayedPackageAndResetTemporaryPackageInfo', () => {
  test('sets the displayedPackage and loads the right initial temporaryPackageInfo', () => {
    const testPackageInfo: PackageInfo = { packageName: 'React' };
    const testResources: Resources = {
      file1: 1,
    };
    const testAttributions: Attributions = {
      uuid: testPackageInfo,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file1': ['uuid'],
    };
    const expectedDisplayedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: 'uuid',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    expect(getDisplayedPackage(testStore.getState())).toBeNull();
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual({});

    testStore.dispatch(
      setDisplayedPackageAndResetTemporaryPackageInfo(expectedDisplayedPackage)
    );
    expect(getDisplayedPackage(testStore.getState())).toEqual(
      expectedDisplayedPackage
    );
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testPackageInfo
    );
  });
});

describe('resetSelectedPackagePanelIfContainedAttributionWasRemoved', () => {
  let originalIpcRenderer: IpcRenderer;

  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('resets the selectedPackage attributionId if the attribution has been removed from the resource', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: 80,
    };
    const testResources: Resources = {
      parent: { child: 1 },
    };
    const testManualAttributions: Attributions = {
      uuid1: testReact,
    };
    const initialResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/child': ['uuid1'],
    };
    const initialSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: 'uuid1',
    };

    const expectedResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/': ['uuid1'],
    };
    const expectedSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: '',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: initialResourcesToManualAttributions,
        })
      )
    );
    testStore.dispatch(setSelectedResourceId('/parent/child'));
    testStore.dispatch(setDisplayedPackage(initialSelectedPackage));

    testStore.dispatch(savePackageInfo('/parent/', null, testReact));
    expect(getManualData(testStore.getState()).resourcesToAttributions).toEqual(
      expectedResourcesToManualAttributions
    );
    expect(getDisplayedPackage(testStore.getState())).toEqual(
      expectedSelectedPackage
    );
  });
});
