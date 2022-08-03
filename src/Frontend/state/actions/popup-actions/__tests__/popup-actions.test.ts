// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  DiscreteConfidence,
  PackagePanelTitle,
  PopupType,
  View,
} from '../../../../enums/enums';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import {
  getManualAttributions,
  getManualData,
  getTemporaryPackageInfo,
} from '../../../selectors/all-views-resource-selectors';
import {
  getOpenPopup,
  getSelectedView,
  getTargetView,
} from '../../../selectors/view-selector';
import {
  navigateToView,
  openPopup,
  setTargetView,
} from '../../view-actions/view-actions';
import {
  changeSelectedAttributionIdOrOpenUnsavedPopup,
  navigateToSelectedPathOrOpenUnsavedPopup,
  navigateToTargetResourceOrAttribution,
  saveTemporaryPackageInfoAndNavigateToTargetView,
  selectAttributionInAccordionPanelOrOpenUnsavedPopup,
  selectAttributionInManualPackagePanelOrOpenUnsavedPopup,
  setSelectedResourceIdOrOpenUnsavedPopup,
  setViewOrOpenUnsavedPopup,
  unlinkAttributionAndSavePackageInfoAndNavigateToTargetView,
} from '../popup-actions';
import { PanelPackage, State } from '../../../../types/types';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import {
  AttributionData,
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { savePackageInfo } from '../../resource-actions/save-actions';
import { setSelectedAttributionId } from '../../resource-actions/attribution-view-simple-actions';
import {
  setDisplayedPackage,
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../resource-actions/load-actions';
import {
  setResources,
  setTemporaryPackageInfo,
} from '../../resource-actions/all-views-simple-actions';
import {
  getDisplayedPackage,
  getExpandedIds,
  getSelectedResourceId,
  getTargetSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import {
  getSelectedAttributionId,
  getTargetSelectedAttributionId,
} from '../../../selectors/attribution-view-resource-selectors';

describe('The actions checking for unsaved changes', () => {
  describe('navigateToSelectedPathOrOpenUnsavedPopup', () => {
    it('sets view, selectedResourceId and expandedResources', () => {
      const testStore = createTestAppStore();
      testStore.dispatch(navigateToView(View.Attribution));
      testStore.dispatch(
        navigateToSelectedPathOrOpenUnsavedPopup('/folder1/folder2/test_file')
      );

      expect(getSelectedResourceId(testStore.getState())).toBe(
        '/folder1/folder2/test_file'
      );
      expect(getExpandedIds(testStore.getState())).toMatchObject([
        '/',
        '/folder1/',
        '/folder1/folder2/',
        '/folder1/folder2/test_file',
      ]);
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);
    });
  });

  describe('changeSelectedAttributionIdOrOpenUnsavedPopup', () => {
    it(
      'setsTargetSelectedAttributionId and temporaryPackageInfo' +
        ' and opens popup if packageInfo were modified',
      () => {
        const testResources: Resources = {
          selectedResource: 1,
          newSelectedResource: 1,
        };
        const testManualAttributions: Attributions = {
          uuid_1: { packageName: 'React' },
        };
        const testStore = createTestAppStore();
        testStore.dispatch(
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources: testResources,
              manualAttributions: testManualAttributions,
            })
          )
        );

        testStore.dispatch(setSelectedResourceId('selectedResource'));
        testStore.dispatch(navigateToView(View.Attribution));
        testStore.dispatch(
          savePackageInfo(null, null, { packageName: 'Test' })
        );
        testStore.dispatch(setTemporaryPackageInfo({ packageName: 'Test 2' }));

        testStore.dispatch(
          changeSelectedAttributionIdOrOpenUnsavedPopup('uuid_1')
        );

        expect(getTargetSelectedAttributionId(testStore.getState())).toBe(
          'uuid_1'
        );
        expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
        expect(getOpenPopup(testStore.getState())).toBe(
          PopupType.NotSavedPopup
        );
        expect(getSelectedAttributionId(testStore.getState())).toBe('');
        expect(getTemporaryPackageInfo(testStore.getState())).toEqual({
          packageName: 'Test 2',
        });
      }
    );

    it('setSelectedAttributionId and temporaryPackageInfo if packageInfo were not modified', () => {
      const testResources: Resources = {
        selectedResource: 1,
        newSelectedResource: 1,
      };
      const testManualAttributions: Attributions = {
        uuid_1: { packageName: 'React' },
      };
      const testStore = createTestAppStore();
      testStore.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
          })
        )
      );

      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(setSelectedAttributionId('selectedAttributionId'));
      testStore.dispatch(navigateToView(View.Attribution));
      testStore.dispatch(setTemporaryPackageInfo({ packageName: 'Test' }));
      testStore.dispatch(
        savePackageInfo('selectedResource', 'selectedAttributionId', {
          packageName: 'Test',
        })
      );

      testStore.dispatch(
        changeSelectedAttributionIdOrOpenUnsavedPopup('uuid_1')
      );

      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
      expect(getOpenPopup(testStore.getState())).toBeFalsy();
      expect(getSelectedAttributionId(testStore.getState())).toBe('uuid_1');
      expect(getTemporaryPackageInfo(testStore.getState())).toEqual({
        packageName: 'React',
      });
    });
  });

  describe('The setViewOrOpenUnsavedPopup action', () => {
    it('sets view', () => {
      const testStore = createTestAppStore();
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setViewOrOpenUnsavedPopup(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    });

    it('opens unsave-popup', () => {
      const testStore = createTestAppStore();
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setSelectedResourceId('/testId/'));
      testStore.dispatch(setTemporaryPackageInfo({ packageName: 'new Name' }));
      testStore.dispatch(setViewOrOpenUnsavedPopup(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);
      expect(getTargetView(testStore.getState())).toBe(View.Attribution);
      expect(getTargetSelectedResourceId(testStore.getState())).toBe(
        '/testId/'
      );
      expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    });
  });

  describe('setSelectedResourceIdOrOpenUnsavedPopup', () => {
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
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestTemporaryPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryPackageInfo,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    it('set selected resource id', () => {
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
      testStore.dispatch(setSelectedResourceId('/root/'));
      expect(getSelectedResourceId(testStore.getState())).toBe('/root/');
      testStore.dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup('/thirdParty/')
      );
      expect(getSelectedResourceId(testStore.getState())).toBe('/thirdParty/');
    });

    it('open unsaved-popup', () => {
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
      testStore.dispatch(setSelectedResourceId('/root/'));
      testStore.dispatch(setTemporaryPackageInfo({ packageName: 'new Name' }));
      expect(getSelectedResourceId(testStore.getState())).toBe('/root/');
      testStore.dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup('/thirdParty/')
      );
      expect(getSelectedResourceId(testStore.getState())).toBe('/root/');
      expect(getTargetSelectedResourceId(testStore.getState())).toBe(
        '/thirdParty/'
      );
      expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    });
  });

  describe('selectAttributionInAccordionPanelOrOpenUnsavedPopup', () => {
    it('selects an attribution in an accordion panel', () => {
      const testPackageInfo: PackageInfo = { packageName: 'test name' };
      const testResources: Resources = {
        file1: 1,
      };
      const testAttributions: Attributions = {
        uuid: testPackageInfo,
      };
      const testResourcesToManualAttributions: ResourcesToAttributions = {
        '/file1': ['uuid'],
      };
      const testSelectedPackage: PanelPackage = {
        panel: PackagePanelTitle.AllAttributions,
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

      testStore.dispatch(
        selectAttributionInAccordionPanelOrOpenUnsavedPopup(
          testSelectedPackage.panel,
          testSelectedPackage.attributionId
        )
      );
      expect(getDisplayedPackage(testStore.getState())).toEqual(
        testSelectedPackage
      );
      expect(getTemporaryPackageInfo(testStore.getState())).toEqual({});
    });
  });

  describe('selectAttributionInManualPackagePanelOrOpenUnsavedPopup', () => {
    it('ss an attribution in the manual package panel', () => {
      const testPackageInfo: PackageInfo = { packageName: 'test name' };
      const testResources: Resources = {
        file1: 1,
      };
      const testAttributions: Attributions = {
        uuid: testPackageInfo,
      };
      const testResourcesToManualAttributions: ResourcesToAttributions = {
        '/file1': ['uuid'],
      };
      const testSelectedPackage: PanelPackage = {
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

      testStore.dispatch(
        selectAttributionInManualPackagePanelOrOpenUnsavedPopup(
          testSelectedPackage.panel,
          testSelectedPackage.attributionId
        )
      );
      expect(getDisplayedPackage(testStore.getState())).toEqual(
        testSelectedPackage
      );
      expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
        testPackageInfo
      );
    });
  });
});

describe('The actions called from the unsaved popup', () => {
  describe('unlinkAttributionAndSavePackageInfoAndNavigateToTargetView', () => {
    it('unlinks and navigates to target view', () => {
      const testReact = {
        packageName: 'React',
      };
      const testResources: Resources = {
        'something.js': 1,
        'somethingElse.js': 1,
      };
      const testInitialManualAttributions: Attributions = {
        reactUuid: testReact,
      };
      const testInitialResourcesToManualAttributions: ResourcesToAttributions =
        {
          '/something.js': ['reactUuid'],
          '/somethingElse.js': ['reactUuid'],
        };
      const expectedManualData: AttributionData = {
        attributions: testInitialManualAttributions,
        resourcesToAttributions: {
          '/somethingElse.js': ['reactUuid'],
        },
        attributionsToResources: {
          reactUuid: ['/somethingElse.js'],
        },
        resourcesWithAttributedChildren: {
          '/': new Set<string>().add('/somethingElse.js'),
        },
      };

      const testStore = createTestAppStore();
      testStore.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testInitialManualAttributions,
            resourcesToManualAttributions:
              testInitialResourcesToManualAttributions,
          })
        )
      );
      testStore.dispatch(setSelectedResourceId('/something.js'));
      testStore.dispatch(
        setDisplayedPackage({
          panel: PackagePanelTitle.ManualPackages,
          attributionId: 'reactUuid',
        })
      );
      testStore.dispatch(setTemporaryPackageInfo({}));
      testStore.dispatch(setTargetView(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);

      testStore.dispatch(
        unlinkAttributionAndSavePackageInfoAndNavigateToTargetView()
      );
      expect(getManualData(testStore.getState())).toEqual(expectedManualData);
      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    });
  });

  describe('saveTemporaryPackageInfoAndNavigateToTargetView', () => {
    function prepareTestState(): State {
      const testStore = createTestAppStore();
      const testResources: Resources = {
        selectedResource: 1,
        newSelectedResource: 1,
      };
      testStore.dispatch(
        loadFromFile(getParsedInputFileEnrichedWithTestData(testResources))
      );
      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(setTemporaryPackageInfo({ packageName: 'Test' }));
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setTargetView(View.Attribution));
      testStore.dispatch(openPopup(PopupType.NotSavedPopup));
      testStore.dispatch(setTargetSelectedResourceId('newSelectedResource'));
      testStore.dispatch(saveTemporaryPackageInfoAndNavigateToTargetView());

      return testStore.getState();
    }

    it('saves temporaryPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getTemporaryPackageInfo(state)).toMatchObject({});
    });

    it('sets TargetSelectedResourceOrAttribution', () => {
      const state: State = prepareTestState();
      expect(getSelectedResourceId(state)).toBe('newSelectedResource');
    });

    it('sets View', () => {
      const state: State = prepareTestState();
      expect(getSelectedView(state)).toBe(View.Attribution);
    });

    it('closesPopup', () => {
      const state: State = prepareTestState();
      expect(getOpenPopup(state)).toBeFalsy();
    });
  });

  describe('navigateToTargetResourceOrAttribution', () => {
    function prepareTestState(): State {
      const testStore = createTestAppStore();
      testStore.dispatch(
        setResources({ selectedResource: 1, newSelectedResource: 1 })
      );
      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(setTemporaryPackageInfo({ packageName: 'Test' }));
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setTargetView(View.Attribution));
      testStore.dispatch(openPopup(PopupType.NotSavedPopup));
      testStore.dispatch(setTargetSelectedResourceId('newSelectedResource'));
      testStore.dispatch(navigateToTargetResourceOrAttribution());
      return testStore.getState();
    }

    it('closesPopup', () => {
      const state: State = prepareTestState();
      expect(getOpenPopup(state)).toBeFalsy();
    });

    it('sets the view', () => {
      const state: State = prepareTestState();
      expect(getSelectedView(state)).toBe(View.Attribution);
    });

    it('sets targetSelectedResourceOrAttribution', () => {
      const state: State = prepareTestState();
      expect(getSelectedResourceId(state)).toBe('newSelectedResource');
    });

    it('sets temporaryPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getTemporaryPackageInfo(state)).toMatchObject({});
    });

    it('does not save temporaryPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getManualAttributions(state)).toMatchObject({});
    });
  });
});
