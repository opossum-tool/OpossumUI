// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';
import { act } from 'react-dom/test-utils';

import {
  AttributionData,
  Attributions,
  Criticality,
  DiscreteConfidence,
  DisplayPackageInfo,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../../shared/shared-types';
import {
  AllowedSaveOperations,
  PackagePanelTitle,
  PopupType,
  View,
} from '../../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../../shared-constants';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import {
  createTestAppStore,
  EnhancedTestStore,
} from '../../../../test-helpers/render-component-with-store';
import { PanelPackage, State } from '../../../../types/types';
import { convertDisplayPackageInfoToPackageInfo } from '../../../../util/convert-package-info';
import {
  getCurrentAttributionId,
  getDisplayedPackage,
  getManualAttributions,
  getManualData,
  getResourcesWithLocatedAttributions,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/all-views-resource-selectors';
import {
  getSelectedAttributionIdInAttributionView,
  getTargetSelectedAttributionId,
} from '../../../selectors/attribution-view-resource-selectors';
import {
  getAttributionWizardPackageNames,
  getAttributionWizardPackageNamespaces,
  getAttributionWizardPackageVersions,
  getAttributionWizardSelectedPackageAttributeIds,
  getAttributionWizardTotalAttributionCount,
  getAttributionWizarOriginalDisplayPackageInfo,
} from '../../../selectors/attribution-wizard-selectors';
import {
  getExpandedIds,
  getSelectedResourceId,
  getTargetSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import { getShowNoSignalsLocatedMessage } from '../../../selectors/locate-popup-selectors';
import {
  getOpenPopup,
  getPopupAttributionId,
  getSelectedView,
  getTargetView,
} from '../../../selectors/view-selector';
import {
  setExternalData,
  setManualData,
  setResources,
  setTemporaryDisplayPackageInfo,
} from '../../resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../resource-actions/attribution-view-simple-actions';
import {
  setDisplayedPackage,
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../resource-actions/load-actions';
import {
  savePackageInfo,
  setAllowedSaveOperations,
} from '../../resource-actions/save-actions';
import {
  navigateToView,
  openPopup,
  setTargetView,
} from '../../view-actions/view-actions';
import {
  changeSelectedAttributionIdOrOpenUnsavedPopup,
  checkIfWasPreferredAndShowWarningOrUnlinkAndSave,
  checkIfWasPreferredOrPreferredStatusChangedAndShowWarningOrSave,
  closePopupAndUnsetTargets,
  locateSignalsFromLocatorPopup,
  locateSignalsFromProjectStatisticsPopup,
  navigateToSelectedPathOrOpenUnsavedPopup,
  navigateToTargetResourceOrAttribution,
  openAttributionWizardPopup,
  removeWasPreferred,
  saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
  selectPackageCardInAuditViewOrOpenUnsavedPopup,
  setSelectedResourceIdOrOpenUnsavedPopup,
  setViewOrOpenUnsavedPopup,
  unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
} from '../popup-actions';

describe('The actions checking for unsaved changes', () => {
  describe('navigateToSelectedPathOrOpenUnsavedPopup', () => {
    it('sets view, selectedResourceId and expandedResources', () => {
      const testStore = createTestAppStore();
      testStore.dispatch(navigateToView(View.Attribution));
      testStore.dispatch(
        navigateToSelectedPathOrOpenUnsavedPopup('/folder1/folder2/test_file'),
      );

      expect(getSelectedResourceId(testStore.getState())).toBe(
        '/folder1/folder2/test_file',
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
      'setsTargetSelectedAttributionId and temporaryDisplayPackageInfo' +
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
            }),
          ),
        );

        testStore.dispatch(setSelectedResourceId('selectedResource'));
        testStore.dispatch(navigateToView(View.Attribution));
        testStore.dispatch(
          savePackageInfo(null, null, { packageName: 'Test' }),
        );
        testStore.dispatch(
          setTemporaryDisplayPackageInfo({
            packageName: 'Test 2',
            attributionIds: [],
          }),
        );

        testStore.dispatch(
          changeSelectedAttributionIdOrOpenUnsavedPopup('uuid_1'),
        );

        expect(getTargetSelectedAttributionId(testStore.getState())).toBe(
          'uuid_1',
        );
        expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
        expect(getOpenPopup(testStore.getState())).toBe(
          PopupType.NotSavedPopup,
        );
        expect(
          getSelectedAttributionIdInAttributionView(testStore.getState()),
        ).toBe('');
        expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual({
          packageName: 'Test 2',
          attributionIds: [],
        });
      },
    );

    it('setSelectedAttributionId and temporaryDisplayPackageInfo if packageInfo were not modified', () => {
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
          }),
        ),
      );

      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(setSelectedAttributionId('selectedAttributionId'));
      testStore.dispatch(navigateToView(View.Attribution));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          attributionIds: [],
        }),
      );
      testStore.dispatch(
        savePackageInfo('selectedResource', 'selectedAttributionId', {
          packageName: 'Test',
        }),
      );

      testStore.dispatch(
        changeSelectedAttributionIdOrOpenUnsavedPopup('uuid_1'),
      );

      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
      expect(getOpenPopup(testStore.getState())).toBeFalsy();
      expect(
        getSelectedAttributionIdInAttributionView(testStore.getState()),
      ).toBe('uuid_1');
      expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual({
        packageName: 'React',
        attributionIds: ['uuid_1'],
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
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'new Name',
          attributionIds: [],
        }),
      );
      testStore.dispatch(setViewOrOpenUnsavedPopup(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);
      expect(getTargetView(testStore.getState())).toBe(View.Attribution);
      expect(getTargetSelectedResourceId(testStore.getState())).toBe(
        '/testId/',
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
    const testPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testPackageInfo,
      [testManualAttributionUuid_2]: secondTestPackageInfo,
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
          }),
        ),
      );
      testStore.dispatch(setSelectedResourceId('/root/'));
      expect(getSelectedResourceId(testStore.getState())).toBe('/root/');
      testStore.dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup('/thirdParty/'),
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
          }),
        ),
      );
      testStore.dispatch(setSelectedResourceId('/root/'));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'new Name',
          attributionIds: [],
        }),
      );
      expect(getSelectedResourceId(testStore.getState())).toBe('/root/');
      testStore.dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup('/thirdParty/'),
      );
      expect(getSelectedResourceId(testStore.getState())).toBe('/root/');
      expect(getTargetSelectedResourceId(testStore.getState())).toBe(
        '/thirdParty/',
      );
      expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    });
  });

  describe('selectPackageCardInAuditViewOrOpenUnsavedPopup', () => {
    it('selects an attribution in an accordion panel', () => {
      const testPackageInfo: PackageInfo = { packageName: 'test name' };
      const testDisplayPackageInfo: DisplayPackageInfo = {
        ...testPackageInfo,
        attributionIds: ['uuid'],
      };
      const testPackageCardId = 'All Attributions-0';
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
        packageCardId: testPackageCardId,
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

      testStore.dispatch(
        selectPackageCardInAuditViewOrOpenUnsavedPopup(
          testSelectedPackage.panel,
          testSelectedPackage.packageCardId,
          testSelectedPackage.displayPackageInfo,
        ),
      );
      expect(getDisplayedPackage(testStore.getState())).toEqual(
        testSelectedPackage,
      );
      expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
        testDisplayPackageInfo,
      );
    });
  });

  describe('selectAttributionInManualPackagePanelOrOpenUnsavedPopup', () => {
    it('ss an attribution in the manual package panel', () => {
      const testPackageInfo: PackageInfo = { packageName: 'test name' };
      const testPackageCardId = 'All Attributions-0';
      const testDisplayPackageInfo: DisplayPackageInfo = {
        ...testPackageInfo,
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
      const testSelectedPackage: PanelPackage = {
        panel: PackagePanelTitle.ManualPackages,
        packageCardId: testPackageCardId,
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

      testStore.dispatch(
        selectPackageCardInAuditViewOrOpenUnsavedPopup(
          testSelectedPackage.panel,
          testSelectedPackage.packageCardId,
          testSelectedPackage.displayPackageInfo,
        ),
      );
      expect(getDisplayedPackage(testStore.getState())).toEqual(
        testSelectedPackage,
      );
      expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual({
        ...testPackageInfo,
        attributionIds: ['uuid'],
      });
    });
  });
});

describe('The actions called from the unsaved popup', () => {
  const testPackage = {
    packageName: 'Name',
  };
  const testResources: Resources = {
    'something.js': 1,
  };
  const testInitialManualAttributions: Attributions = {};
  const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
    '/something.js': ['id1'],
  };

  function prepareTestStore(
    view: View,
    testDisplayPackageInfo: DisplayPackageInfo,
  ): EnhancedTestStore {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(view));
    // load data that is sufficient to call unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testInitialManualAttributions,
          resourcesToManualAttributions:
            testInitialResourcesToManualAttributions,
        }),
      ),
    );
    // set current attribution id for all views
    if (view === View.Attribution) {
      testStore.dispatch(setSelectedAttributionId('id1'));
    }
    if (view === View.Audit) {
      const testSelectedPackage: PanelPackage = {
        panel: PackagePanelTitle.ManualPackages,
        packageCardId: 'Attributions-0',
        displayPackageInfo: testDisplayPackageInfo,
      };
      testStore.dispatch(setDisplayedPackage(testSelectedPackage));
    }
    if (view === View.Report) {
      testStore.dispatch(openPopup(PopupType.EditAttributionPopup, 'id1'));
    }
    testStore.dispatch(setTemporaryDisplayPackageInfo(testDisplayPackageInfo));
    return testStore;
  }

  const views = [View.Audit, View.Attribution, View.Report];
  describe.each(views)(
    'checkIfWasPreferredAndShowWarningOrUnlinkAndSave in %s View',
    (view: View) => {
      const notSelectedViews = views.filter(
        (viewCandidate) => viewCandidate !== view,
      );

      it('shows warning that attribution was preferred', () => {
        const testDisplayPackageInfo: DisplayPackageInfo = {
          ...testPackage,
          wasPreferred: true,
          attributionIds: ['id1'],
        };
        const testStore = prepareTestStore(view, testDisplayPackageInfo);
        testStore.dispatch(setTargetView(notSelectedViews[0]));

        testStore.dispatch(checkIfWasPreferredAndShowWarningOrUnlinkAndSave());
        expect(getCurrentAttributionId(testStore.getState())).toBe('id1');
        expect(getOpenPopup(testStore.getState())).toBe(
          PopupType.ModifyWasPreferredAttributionPopup,
        );
        expect(getPopupAttributionId(testStore.getState())).toBe('id1');
      });

      it('saves and navigates to target if attribution was not preferred', () => {
        const testDisplayPackageInfo: DisplayPackageInfo = {
          ...testPackage,
          attributionIds: ['id1'],
        };
        const testStore = prepareTestStore(view, testDisplayPackageInfo);
        testStore.dispatch(setTargetView(notSelectedViews[0]));

        testStore.dispatch(checkIfWasPreferredAndShowWarningOrUnlinkAndSave());
        expect(getSelectedView(testStore.getState())).toBe(notSelectedViews[0]);
      });
    },
  );

  describe.each(views)(
    'checkIfWasPreferredOrPreferredStatusChangedAndShowWarningOrSave in %s View',
    (view: View) => {
      const notSelectedViews = views.filter(
        (viewCandidate) => viewCandidate !== view,
      );
      it('shows warning that attribution was preferred', () => {
        const testDisplayPackageInfo: DisplayPackageInfo = {
          ...testPackage,
          wasPreferred: true,
          attributionIds: ['id1'],
        };
        const testStore = prepareTestStore(view, testDisplayPackageInfo);
        testStore.dispatch(setTargetView(notSelectedViews[0]));

        testStore.dispatch(
          checkIfWasPreferredOrPreferredStatusChangedAndShowWarningOrSave(),
        );
        expect(getCurrentAttributionId(testStore.getState())).toBe('id1');
        expect(getOpenPopup(testStore.getState())).toBe(
          PopupType.ModifyWasPreferredAttributionPopup,
        );
        expect(getPopupAttributionId(testStore.getState())).toBe('id1');
      });

      it('saves and navigates to target view', () => {
        const testDisplayPackageInfo: DisplayPackageInfo = {
          ...testPackage,
          attributionIds: ['id1'],
        };
        const testStore = prepareTestStore(view, testDisplayPackageInfo);
        testStore.dispatch(setTargetView(notSelectedViews[0]));

        testStore.dispatch(
          checkIfWasPreferredOrPreferredStatusChangedAndShowWarningOrSave(),
        );
        expect(getSelectedView(testStore.getState())).toBe(notSelectedViews[0]);
      });
    },
  );

  describe('navigateToTargetResourceOrAttribution', () => {
    function prepareTestState(): State {
      const testStore = createTestAppStore();
      testStore.dispatch(
        setResources({ selectedResource: 1, newSelectedResource: 1 }),
      );
      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          attributionIds: [],
        }),
      );
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

    it('sets temporaryDisplayPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getTemporaryDisplayPackageInfo(state)).toMatchObject({});
    });

    it('does not save temporaryDisplayPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getManualAttributions(state)).toMatchObject({});
    });
  });
});

describe('Actions used by the ModifyWasPreferredAttributionPopup', () => {
  describe('unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled', () => {
    const testReact = {
      packageName: 'React',
    };
    const testPackageCardId = 'Attributions-0';
    const testDisplayPackageInfo: DisplayPackageInfo = {
      ...testReact,
      attributionIds: ['reactUuid'],
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      reactUuid: testReact,
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['reactUuid'],
      '/somethingElse.js': ['reactUuid'],
    };

    function prepareTestStore(): EnhancedTestStore {
      const testStore = createTestAppStore();
      testStore.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testInitialManualAttributions,
            resourcesToManualAttributions:
              testInitialResourcesToManualAttributions,
          }),
        ),
      );
      testStore.dispatch(setSelectedResourceId('/something.js'));
      testStore.dispatch(
        setDisplayedPackage({
          panel: PackagePanelTitle.ManualPackages,
          packageCardId: testPackageCardId,
          displayPackageInfo: testDisplayPackageInfo,
        }),
      );
      testStore.dispatch(
        setTemporaryDisplayPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO),
      );
      return testStore;
    }

    it('unlinks and navigates to target view', () => {
      const expectedManualData: AttributionData = {
        attributions: testInitialManualAttributions,
        resourcesToAttributions: {
          '/somethingElse.js': ['reactUuid'],
        },
        attributionsToResources: {
          reactUuid: ['/somethingElse.js'],
        },
        resourcesWithAttributedChildren: {
          attributedChildren: {
            '1': new Set<number>().add(2),
          },
          pathsToIndices: {
            '/': 1,
            '/something.js': 0,
            '/somethingElse.js': 2,
          },
          paths: ['/something.js', '/', '/somethingElse.js'],
        },
      };

      const testStore = prepareTestStore();
      testStore.dispatch(setTargetView(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);

      testStore.dispatch(
        unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
      );
      expect(getManualData(testStore.getState())).toEqual(expectedManualData);
      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    });

    it('warns the user that saving is disabled and does not change data', () => {
      const expectedManualData: AttributionData = {
        attributions: testInitialManualAttributions,
        resourcesToAttributions: testInitialResourcesToManualAttributions,
        attributionsToResources: {
          reactUuid: ['/something.js', '/somethingElse.js'],
        },
        resourcesWithAttributedChildren: {
          attributedChildren: {
            '1': new Set<number>().add(0).add(2),
          },
          pathsToIndices: {
            '/': 1,
            '/something.js': 0,
            '/somethingElse.js': 2,
          },
          paths: ['/something.js', '/', '/somethingElse.js'],
        },
      };
      const testStore = prepareTestStore();

      testStore.dispatch(setAllowedSaveOperations(AllowedSaveOperations.None));
      testStore.dispatch(setTargetView(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);

      testStore.dispatch(
        unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
      );
      expect(getOpenPopup(testStore.getState())).toBe(
        PopupType.UnableToSavePopup,
      );
      expect(getManualData(testStore.getState())).toEqual(expectedManualData);
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);
    });
  });

  describe('saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled', () => {
    function prepareTestStore(): EnhancedTestStore {
      const testStore = createTestAppStore();
      const testResources: Resources = {
        selectedResource: 1,
        newSelectedResource: 1,
      };
      testStore.dispatch(
        loadFromFile(getParsedInputFileEnrichedWithTestData(testResources)),
      );
      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          attributionIds: [],
        }),
      );
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setTargetView(View.Attribution));
      testStore.dispatch(
        openPopup(PopupType.ModifyWasPreferredAttributionPopup),
      );
      testStore.dispatch(setTargetSelectedResourceId('newSelectedResource'));

      return testStore;
    }

    function prepareTestState(): State {
      const testStore = prepareTestStore();
      testStore.dispatch(
        saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
      );

      return testStore.getState();
    }

    it('saves temporaryDisplayPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getTemporaryDisplayPackageInfo(state)).toMatchObject({
        attributionIds: [],
      });
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

    it('warns if saving is disabled and does not change data', () => {
      const testStore = prepareTestStore();
      testStore.dispatch(setAllowedSaveOperations(AllowedSaveOperations.None));

      testStore.dispatch(
        saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
      );
      expect(getOpenPopup(testStore.getState())).toBe(
        PopupType.UnableToSavePopup,
      );
      expect(
        getTemporaryDisplayPackageInfo(testStore.getState()),
      ).toMatchObject({
        packageName: 'Test',
        attributionIds: [],
      });
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);
    });
  });
});

describe('Action used by NotSavedPopup and ModifyWasPreferredAttributionPopup', () => {
  describe('closePopupAndReopenEditAttributionPopupIfItWasPreviouslyOpen', () => {
    it.each([[View.Audit], [View.Attribution]])(
      'closes popup and unsets targets in % view',
      (view: View) => {
        const testStore = createTestAppStore();
        testStore.dispatch(navigateToView(view));
        if (view === View.Attribution) {
          testStore.dispatch(setSelectedAttributionId('id1'));
        }
        if (view === View.Audit) {
          const testSelectedPackage: PanelPackage = {
            panel: PackagePanelTitle.AllAttributions,
            packageCardId: 'All Attributions-0',
            displayPackageInfo: { attributionIds: ['id1'] },
          };
          testStore.dispatch(setDisplayedPackage(testSelectedPackage));
        }
        testStore.dispatch(
          openPopup(PopupType.ModifyWasPreferredAttributionPopup),
        );

        testStore.dispatch(closePopupAndUnsetTargets());
        expect(getTargetView(testStore.getState())).toBe(null);
        expect(getTargetSelectedResourceId(testStore.getState())).toBe('');
        expect(getTargetSelectedAttributionId(testStore.getState())).toBe('');
        expect(getOpenPopup(testStore.getState())).toBeFalsy();
      },
    );

    it('closes popup and unsets targets', () => {
      const testStore = createTestAppStore();
      testStore.dispatch(
        openPopup(PopupType.ModifyWasPreferredAttributionPopup),
      );

      testStore.dispatch(closePopupAndUnsetTargets());
      expect(getTargetView(testStore.getState())).toBe(null);
      expect(getTargetSelectedResourceId(testStore.getState())).toBe('');
      expect(getTargetSelectedAttributionId(testStore.getState())).toBe('');
      expect(getOpenPopup(testStore.getState())).toBe(null);
    });
  });
});

describe('openAttributionWizardPopup', () => {
  const selectedResourceId = '/samplepath/';
  const testManualAttributions: Attributions = {
    uuid_0: {
      packageType: 'generic',
      packageName: 'react',
      packageNamespace: 'npm',
      packageVersion: '18.2.0',
    },
  };
  const testManualResourcesToAttributions: ResourcesToAttributions = {
    [selectedResourceId]: ['uuid_0'],
  };
  const testExternalAttributions: Attributions = {
    uuid_1: {
      packageType: 'generic',
      packageName: 'numpy',
      packageNamespace: 'pip',
      packageVersion: '1.24.1',
    },
  };
  const testExternalResourcesToAttributions: ResourcesToAttributions = {
    '/samplepath/file': ['uuid_1'],
  };

  it('writes initial attribution wizard state into store', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions,
      ),
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions),
    );
    act(() => {
      testStore.dispatch(openAttributionWizardPopup('uuid_0'));
    });
    const expectedOriginalAttribution: PackageInfo = {
      packageType: 'generic',
      packageName: 'react',
      packageNamespace: 'npm',
      packageVersion: '18.2.0',
    };
    const expectedPackageNamespacesValues = [
      { text: 'pip', count: 1 },
      { text: 'npm', count: 1 },
    ];
    const expectedPackageNamesValues = [
      { text: 'numpy', count: 1 },
      { text: 'react', count: 1 },
    ];
    const expectedPackageVersionsValues = [
      { text: '1.24.1' },
      { text: '18.2.0' },
    ];
    const expectedTotalAttributionCount = 2;

    const testOriginalDisplayPackageInfo =
      getAttributionWizarOriginalDisplayPackageInfo(testStore.getState());
    const testPackageNamespaces = getAttributionWizardPackageNamespaces(
      testStore.getState(),
    );
    const testPackageNames = getAttributionWizardPackageNames(
      testStore.getState(),
    );
    const testPackageVersions = getAttributionWizardPackageVersions(
      testStore.getState(),
    );
    const testSelectedPackageAttributeIds =
      getAttributionWizardSelectedPackageAttributeIds(testStore.getState());
    const testTotalAttributionCount = getAttributionWizardTotalAttributionCount(
      testStore.getState(),
    );

    expect(
      convertDisplayPackageInfoToPackageInfo(testOriginalDisplayPackageInfo),
    ).toEqual(expectedOriginalAttribution);
    expect(Object.values(testPackageNamespaces)).toEqual(
      expectedPackageNamespacesValues,
    );
    expect(Object.values(testPackageNames)).toEqual(expectedPackageNamesValues);
    Object.values(testPackageVersions).forEach((packageVersion, index) => {
      expect(packageVersion.text).toBe(
        expectedPackageVersionsValues[index].text,
      );
      expect(packageVersion).toHaveProperty('relatedIds');
    });
    expect(testTotalAttributionCount).toBe(expectedTotalAttributionCount);
    expect(testSelectedPackageAttributeIds.namespaceId.length).toBeGreaterThan(
      0,
    );
    expect(testSelectedPackageAttributeIds.nameId.length).toBeGreaterThan(0);
    expect(testSelectedPackageAttributeIds.versionId.length).toBeGreaterThan(0);
  });

  it('opens popup', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions,
      ),
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions),
    );
    act(() => {
      testStore.dispatch(openAttributionWizardPopup('uuid_0'));
    });
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.AttributionWizardPopup,
    );
  });
});

describe('locateSignalsFromLocatorPopup', () => {
  it('sets showNoSignalsLocatedMessage if no resources are found and does not change view', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(getShowNoSignalsLocatedMessage(testStore.getState())).toBe(false);
    expect(getSelectedView(testStore.getState())).toBe(View.Attribution);

    testStore.dispatch(
      locateSignalsFromLocatorPopup(
        SelectedCriticality.High,
        new Set<string>(['GPL-2.0']),
        '',
        false,
      ),
    );

    expect(getShowNoSignalsLocatedMessage(testStore.getState())).toBe(true);
    expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
  });

  it('navigates to audit view but does not change selected resource', () => {
    const testStore = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'GPL-2.0',
      },
    };

    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
        }),
      ),
    );
    testStore.dispatch(navigateToView(View.Attribution));

    expect(getShowNoSignalsLocatedMessage(testStore.getState())).toBe(false);
    expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    expect(getSelectedResourceId(testStore.getState())).toBe('');
    testStore.dispatch(
      locateSignalsFromLocatorPopup(
        SelectedCriticality.High,
        new Set<string>(['GPL-2.0']),
        'gpl',
        true,
      ),
    );
    expect(getShowNoSignalsLocatedMessage(testStore.getState())).toBe(false);
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);
    expect(getSelectedResourceId(testStore.getState())).toBe('');
  });

  it('navigates to audit view if unsaved changes are handled but does not change selected resource', () => {
    const testStore = createTestAppStore();
    const testInitalPackageInfo: PackageInfo = {
      packageName: 'react',
      packageVersion: '18',
    };
    const testManualAttributions: Attributions = {
      uuid: testInitalPackageInfo,
    };
    const changedDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'react',
      packageVersion: '19',
      attributionIds: ['uuid'],
    };
    const testExternalAttributions: Attributions = {
      uuid_ext: {
        packageName: 'vue',
        licenseName: 'GPL-2.0',
        criticality: Criticality.High,
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder/file': ['uuid_ext'],
    };
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );

    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    testStore.dispatch(setSelectedAttributionId('uuid'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(changedDisplayPackageInfo),
    );
    testStore.dispatch(
      locateSignalsFromLocatorPopup(
        Criticality.High,
        new Set(['GPL-2.0']),
        'gpl',
        true,
      ),
    );
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    testStore.dispatch(
      unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();
    expect(getSelectedResourceId(testStore.getState())).toBe('');
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);
  });
});

describe('locateSignalsFromProjectStatisticsPopup', () => {
  it('locates signals with different license name variant', () => {
    const testStore = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        licenseName: 'Apache-2.0',
      },
      uuid2: {
        licenseName: 'Apache 2.0',
      },
      uuid3: {
        licenseName: 'MIT',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file1': ['uuid1'],
      '/folder2/file2': ['uuid2'],
      '/folder3/file3': ['uuid3'],
    };
    const expectedLocatedResources = new Set<string>([
      '/folder1/file1',
      '/folder2/file2',
    ]);
    const expectedResourcesWithLocatedChildren = new Set<string>([
      '/',
      '/folder1/',
      '/folder2/',
    ]);

    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );

    testStore.dispatch(locateSignalsFromProjectStatisticsPopup('Apache-2.0'));

    const { locatedResources, resourcesWithLocatedChildren } =
      getResourcesWithLocatedAttributions(testStore.getState());
    expect(locatedResources).toEqual(expectedLocatedResources);
    expect(resourcesWithLocatedChildren).toEqual(
      expectedResourcesWithLocatedChildren,
    );
  });

  it('locates signals independently of criticality', () => {
    const testStore = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'MIT',
      },
      uuid2: {
        packageName: 'angular',
        criticality: Criticality.Medium,
        licenseName: 'MIT',
      },
      uuid3: {
        packageName: 'vue',
        licenseName: 'MIT',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file1': ['uuid1'],
      '/folder2/file2': ['uuid2'],
      '/folder3/file3': ['uuid3'],
    };

    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );

    testStore.dispatch(locateSignalsFromProjectStatisticsPopup('MIT'));

    const { locatedResources, resourcesWithLocatedChildren } =
      getResourcesWithLocatedAttributions(testStore.getState());
    const expectedLocatedResources = new Set<string>([
      '/folder1/file1',
      '/folder2/file2',
      '/folder3/file3',
    ]);
    const expectedResourcesWithLocatedChildren = new Set<string>([
      '/',
      '/folder1/',
      '/folder2/',
      '/folder3/',
    ]);

    expect(locatedResources).toEqual(expectedLocatedResources);
    expect(resourcesWithLocatedChildren).toEqual(
      expectedResourcesWithLocatedChildren,
    );
  });

  it('navigates to audit view but does not change selected resource', () => {
    const testStore = createTestAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'GPL-2.0',
      },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder/file': ['uuid1'],
    };

    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );
    testStore.dispatch(navigateToView(View.Attribution));

    expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    expect(getSelectedResourceId(testStore.getState())).toBe('');

    testStore.dispatch(locateSignalsFromProjectStatisticsPopup('GPL-2.0'));

    expect(getShowNoSignalsLocatedMessage(testStore.getState())).toBe(false);
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);
    expect(getSelectedResourceId(testStore.getState())).toBe('');
  });

  it('navigates to audit view if unsaved changes are handled', () => {
    const testStore = createTestAppStore();
    const testInitalPackageInfo: PackageInfo = {
      packageName: 'react',
      packageVersion: '18',
    };
    const testManualAttributions: Attributions = {
      uuid: testInitalPackageInfo,
    };
    const changedDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'react',
      packageVersion: '19',
      attributionIds: ['uuid'],
    };
    const testExternalAttributions: Attributions = {
      uuid_ext: { packageName: 'vue', licenseName: 'GPL-2.0' },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder/file': ['uuid_ext'],
    };
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        }),
      ),
    );

    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(openPopup(PopupType.ProjectStatisticsPopup));
    testStore.dispatch(setSelectedAttributionId('uuid'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(changedDisplayPackageInfo),
    );
    testStore.dispatch(locateSignalsFromProjectStatisticsPopup('GPL-2.0'));
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    testStore.dispatch(
      unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);
  });
});

describe('removeWasPreferred', () => {
  it('removes wasPreferred field from TemporaryDisplayPackageInfo', () => {
    const testStore = createTestAppStore();
    const temporaryDisplayPackageInfo = {
      wasPreferred: true,
      attributionIds: ['id1'],
    };
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
    );

    testStore.dispatch(removeWasPreferred());
    expect(
      getTemporaryDisplayPackageInfo(testStore.getState()).wasPreferred,
    ).toBeFalsy();
  });
});
