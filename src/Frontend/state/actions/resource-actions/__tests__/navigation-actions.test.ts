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
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../../../shared-constants';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { PanelPackage } from '../../../../types/types';
import { convertDisplayPackageInfoToPackageInfo } from '../../../../util/convert-package-info';
import {
  getDisplayedPackage,
  getManualData,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/all-views-resource-selectors';
import { getSelectedAttributionIdInAttributionView } from '../../../selectors/attribution-view-resource-selectors';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import { getSelectedView } from '../../../selectors/view-selector';
import { navigateToView, setTargetView } from '../../view-actions/view-actions';
import { setTemporaryDisplayPackageInfo } from '../all-views-simple-actions';
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
import {
  openResourceInResourceBrowser,
  resetTemporaryDisplayPackageInfo,
  setDisplayedPackageAndResetTemporaryDisplayPackageInfo,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../navigation-actions';
import { savePackageInfo } from '../save-actions';

describe('resetTemporaryDisplayPackageInfo', () => {
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
      packageCardId: 'Attributions-0',
      displayPackageInfo: testDisplayPackageInfo,
    };
    const initialTemporaryDisplayPackageInfo: DisplayPackageInfo = {
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
        }),
      ),
    );
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setSelectedResourceId('/file'));
    testStore.dispatch(setDisplayedPackage(initialSelectedPackage));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(initialTemporaryDisplayPackageInfo),
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      initialTemporaryDisplayPackageInfo,
    );

    testStore.dispatch(resetTemporaryDisplayPackageInfo());
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testDisplayPackageInfo,
    );
  });

  it('works correctly on attribution view', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
    };
    const testManualAttributions: Attributions = {
      uuid1: testReact,
    };
    const initialTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'Vue',
      attributionIds: [],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        }),
      ),
    );
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(setSelectedAttributionId('uuid1'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(initialTemporaryDisplayPackageInfo),
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      initialTemporaryDisplayPackageInfo,
    );

    testStore.dispatch(resetTemporaryDisplayPackageInfo());
    expect(
      convertDisplayPackageInfoToPackageInfo(
        getTemporaryDisplayPackageInfo(testStore.getState()),
      ),
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
    expect(getSelectedAttributionIdInAttributionView(state)).toBe(
      'previousAttributionId',
    );
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
    expect(getSelectedAttributionIdInAttributionView(state)).toBe(
      'newAttributionId',
    );
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
    expect(getSelectedAttributionIdInAttributionView(state)).toBe(
      'newAttributionId',
    );
  });

  it('setDisplayedPackage in case of audit view', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.AllAttributions,
        packageCardId: 'previousPackageCardId',
        displayPackageInfo: {
          packageName: 'react',
          attributionIds: ['uuid_1'],
        },
      }),
    );
    testStore.dispatch(
      setTargetDisplayedPackage({
        panel: PackagePanelTitle.AllAttributions,
        packageCardId: 'newPackageCardId',
        displayPackageInfo: { packageName: 'vue', attributionIds: ['uuid_2'] },
      }),
    );

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getDisplayedPackage(state)?.packageCardId).toBe('newPackageCardId');
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

describe('setDisplayedPackageAndResetTemporaryDisplayPackageInfo', () => {
  it('sets the displayedPackage and loads the right initial temporaryDisplayPackageInfo', () => {
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
      packageCardId: 'Attributions-0',
      displayPackageInfo: testDisplayPackageInfo,
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        }),
      ),
    );
    expect(getDisplayedPackage(testStore.getState())).toBeNull();
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );

    testStore.dispatch(
      setDisplayedPackageAndResetTemporaryDisplayPackageInfo(
        expectedDisplayedPackage,
      ),
    );
    expect(getDisplayedPackage(testStore.getState())).toEqual(
      expectedDisplayedPackage,
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testDisplayPackageInfo,
    );
  });
});

describe('resetSelectedPackagePanelIfContainedAttributionWasRemoved', () => {
  it('resets the selectedPackage if the attribution has been removed from the resource', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
    };
    const testDisplayPackageInfo: DisplayPackageInfo = {
      ...testReact,
      attributionIds: ['uuid1'],
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
      packageCardId: 'Attributions-0',
      displayPackageInfo: testDisplayPackageInfo,
    };

    const expectedResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/': ['uuid1'],
    };
    const expectedSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.ManualPackages,
      packageCardId: ADD_NEW_ATTRIBUTION_BUTTON_ID,
      displayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: initialResourcesToManualAttributions,
        }),
      ),
    );
    testStore.dispatch(setSelectedResourceId('/parent/child'));
    testStore.dispatch(setDisplayedPackage(initialSelectedPackage));

    testStore.dispatch(savePackageInfo('/parent/', null, testReact));
    expect(getManualData(testStore.getState()).resourcesToAttributions).toEqual(
      expectedResourcesToManualAttributions,
    );
    expect(getDisplayedPackage(testStore.getState())).toEqual(
      expectedSelectedPackage,
    );
  });
});
