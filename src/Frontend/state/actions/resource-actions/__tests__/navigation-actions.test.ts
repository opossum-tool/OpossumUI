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
import {
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from '../attribution-view-simple-actions';
import {
  setDisplayedPackage,
  setSelectedResourceId,
  setTargetDisplayedPackage,
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
import { convertDisplayPackageInfoToPackageInfo } from '../../../../util/convert-package-info';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../../shared-constants';

describe('resetTemporaryPackageInfo', () => {
  it('works correctly on audit view', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
    };
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid1'],
    };
    const testResources: Resources = {
      file: 1,
    };
    const testManualAttributions: Attributions = {
      uuid1: testPackageInfo,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file': ['uuid1'],
    };
    const initialSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      attributionId: 'uuid1',
    };
    const initialTemporaryPackageInfo: DisplayPackageInfo = {
      packageName: 'Vue',
      attributionIds: [],
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
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testDisplayPackageInfo
    );
  });

  it('works correctly on attribution view', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
    };
    const testManualAttributions: Attributions = {
      uuid1: testReact,
    };
    const initialTemporaryPackageInfo: DisplayPackageInfo = {
      packageName: 'Vue',
      attributionIds: [],
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
    expect(
      convertDisplayPackageInfoToPackageInfo(
        getTemporaryPackageInfo(testStore.getState())
      )
    ).toEqual(testReact);
  });
});

describe('setSelectedResourceOrAttributionIdFromTarget', () => {
  it('setSelectedResourceId in case of Audit View', () => {
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

  it('setSelectedAttributionId in case of attribution view and targetView Resource', () => {
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

  it('setSelectedAttributionId in case of attribution view and stay on attribution view', () => {
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

  it('setDisplayedPackage in case of audit view', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.AllAttributions,
        attributionId: 'previousAttributionId',
      })
    );
    testStore.dispatch(
      setTargetDisplayedPackage({
        panel: PackagePanelTitle.AllAttributions,
        attributionId: 'newAttributionId',
      })
    );

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getDisplayedPackage(state)?.attributionId).toBe('newAttributionId');
  });
});

describe('setSelectedResourceIdAndExpand', () => {
  it('sets the selectedResourceId', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getSelectedResourceId(state)).toBe('/folder1/folder2/test');
    expect(getSelectedView(state)).toEqual(View.Audit);
  });

  it('sets the expandedIds', () => {
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
  it('sets the displayedPackage and loads the right initial temporaryPackageInfo', () => {
    const testPackageInfo: PackageInfo = { packageName: 'React' };
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid'],
    };
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
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO
    );

    testStore.dispatch(
      setDisplayedPackageAndResetTemporaryPackageInfo(expectedDisplayedPackage)
    );
    expect(getDisplayedPackage(testStore.getState())).toEqual(
      expectedDisplayedPackage
    );
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testDisplayPackageInfo
    );
  });
});

describe('resetSelectedPackagePanelIfContainedAttributionWasRemoved', () => {
  it('resets the selectedPackage attributionId if the attribution has been removed from the resource', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
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
