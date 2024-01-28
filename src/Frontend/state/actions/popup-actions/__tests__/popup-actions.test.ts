// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Attributions,
  Criticality,
  DiscreteConfidence,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  SelectedCriticality,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import {
  AllowedSaveOperations,
  PackagePanelTitle,
  PopupType,
  View,
} from '../../../../enums/enums';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { PanelPackage, State } from '../../../../types/types';
import { createAppStore } from '../../../configure-store';
import {
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
  getExpandedIds,
  getSelectedResourceId,
  getTargetSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import { getShowNoSignalsLocatedMessage } from '../../../selectors/locate-popup-selectors';
import {
  getOpenPopup,
  getSelectedView,
  getTargetView,
} from '../../../selectors/view-selector';
import {
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
  checkIfPreferredStatusChangedAndShowWarningOrSave,
  closePopupAndUnsetTargets,
  locateSignalsFromLocatorPopup,
  locateSignalsFromProjectStatisticsPopup,
  navigateToSelectedPathOrOpenUnsavedPopup,
  navigateToTargetResourceOrAttributionOrOpenFileDialog,
  saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
  selectPackageCardInAuditViewOrOpenUnsavedPopup,
  setSelectedResourceIdOrOpenUnsavedPopup,
  setViewOrOpenUnsavedPopup,
  unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
} from '../popup-actions';

describe('The actions checking for unsaved changes', () => {
  describe('navigateToSelectedPathOrOpenUnsavedPopup', () => {
    it('sets view, selectedResourceId and expandedResources', () => {
      const testStore = createAppStore();
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
          uuid_1: { packageName: 'React', id: 'uuid_1' },
        };
        const testStore = createAppStore();
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
          savePackageInfo(null, null, {
            packageName: 'Test',
            id: faker.string.uuid(),
          }),
        );
        testStore.dispatch(
          setTemporaryDisplayPackageInfo({
            packageName: 'Test 2',
            id: faker.string.uuid(),
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
        expect(
          getTemporaryDisplayPackageInfo(testStore.getState()),
        ).toMatchObject<Partial<PackageInfo>>({
          packageName: 'Test 2',
        });
      },
    );

    it('setSelectedAttributionId and temporaryDisplayPackageInfo if packageInfo were not modified', () => {
      const testResources: Resources = {
        selectedResource: 1,
        newSelectedResource: 1,
      };
      const testManualAttributions: Attributions = {
        uuid_1: { packageName: 'React', id: 'uuid_1' },
      };
      const testStore = createAppStore();
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
          id: faker.string.uuid(),
        }),
      );
      testStore.dispatch(
        savePackageInfo('selectedResource', 'selectedAttributionId', {
          packageName: 'Test',
          id: faker.string.uuid(),
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
      expect(
        getTemporaryDisplayPackageInfo(testStore.getState()),
      ).toEqual<PackageInfo>({
        packageName: 'React',
        id: 'uuid_1',
      });
    });
  });

  describe('The setViewOrOpenUnsavedPopup action', () => {
    it('sets view', () => {
      const testStore = createAppStore();
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setViewOrOpenUnsavedPopup(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    });

    it('opens unsave-popup', () => {
      const testStore = createAppStore();
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setSelectedResourceId('/testId/'));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'new Name',
          id: faker.string.uuid(),
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
      id: testManualAttributionUuid_1,
    };
    const secondTestPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
      id: testManualAttributionUuid_2,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testPackageInfo,
      [testManualAttributionUuid_2]: secondTestPackageInfo,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    it('set selected resource id', () => {
      const testStore = createAppStore();
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
      const testStore = createAppStore();
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
          id: faker.string.uuid(),
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
      const testPackageInfo: PackageInfo = {
        packageName: 'test name',
        id: 'uuid',
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
        displayPackageInfo: testPackageInfo,
      };

      const testStore = createAppStore();
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
        testPackageInfo,
      );
    });
  });

  describe('selectAttributionInManualPackagePanelOrOpenUnsavedPopup', () => {
    it('ss an attribution in the manual package panel', () => {
      const testPackageInfo: PackageInfo = {
        packageName: 'test name',
        id: 'uuid',
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
        panel: PackagePanelTitle.ManualPackages,
        packageCardId: testPackageCardId,
        displayPackageInfo: testPackageInfo,
      };

      const testStore = createAppStore();
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
      expect(
        getTemporaryDisplayPackageInfo(testStore.getState()),
      ).toEqual<PackageInfo>({
        ...testPackageInfo,
        id: 'uuid',
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

  function prepareTestStore(view: View, testDisplayPackageInfo: PackageInfo) {
    const testStore = createAppStore();
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
    testStore.dispatch(setTemporaryDisplayPackageInfo(testDisplayPackageInfo));
    return testStore;
  }

  const views = [View.Audit, View.Attribution, View.Report];

  describe.each(views)(
    'checkIfPreferredStatusChangedAndShowWarningOrSave in %s View',
    (view: View) => {
      const notSelectedViews = views.filter(
        (viewCandidate) => viewCandidate !== view,
      );
      it('saves and navigates to target view', () => {
        const testDisplayPackageInfo: PackageInfo = {
          ...testPackage,
          id: faker.string.uuid(),
        };
        const testStore = prepareTestStore(view, testDisplayPackageInfo);
        testStore.dispatch(setTargetView(notSelectedViews[0]));

        testStore.dispatch(checkIfPreferredStatusChangedAndShowWarningOrSave());
        expect(getSelectedView(testStore.getState())).toBe(notSelectedViews[0]);
      });
    },
  );

  describe('navigateToTargetResourceOrAttribution', () => {
    function prepareTestState(): State {
      const testStore = createAppStore();
      testStore.dispatch(
        setResources({ selectedResource: 1, newSelectedResource: 1 }),
      );
      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          id: faker.string.uuid(),
        }),
      );
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setTargetView(View.Attribution));
      testStore.dispatch(openPopup(PopupType.NotSavedPopup));
      testStore.dispatch(setTargetSelectedResourceId('newSelectedResource'));
      testStore.dispatch(
        navigateToTargetResourceOrAttributionOrOpenFileDialog(),
      );
      return testStore.getState();
    }

    it('closes popup', () => {
      const state = prepareTestState();
      expect(getOpenPopup(state)).toBeFalsy();
    });

    it('sets the view', () => {
      const state = prepareTestState();
      expect(getSelectedView(state)).toBe(View.Attribution);
    });

    it('sets targetSelectedResourceOrAttribution', () => {
      const state = prepareTestState();
      expect(getSelectedResourceId(state)).toBe('newSelectedResource');
    });

    it('sets temporaryDisplayPackageInfo', () => {
      const state = prepareTestState();
      expect(getTemporaryDisplayPackageInfo(state)).toMatchObject({});
    });

    it('does not save temporaryDisplayPackageInfo', () => {
      const state = prepareTestState();
      expect(getManualAttributions(state)).toMatchObject({});
    });
  });
});

describe('unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled', () => {
  const testReact: PackageInfo = {
    packageName: 'React',
    id: 'reactUuid',
  };
  const testPackageCardId = 'Attributions-0';
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

  function prepareTestStore() {
    const testStore = createAppStore();
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
        displayPackageInfo: testReact,
      }),
    );
    return testStore;
  }

  it('unlinks and navigates to target view', () => {
    const updatedPackageInfo: PackageInfo = {
      ...testReact,
      packageName: 'VueJS',
    };

    const testStore = prepareTestStore();
    testStore.dispatch(setTemporaryDisplayPackageInfo(updatedPackageInfo));
    testStore.dispatch(setTargetView(View.Attribution));
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);

    testStore.dispatch(
      unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );

    const newManualData = getManualData(testStore.getState());
    const newAttributionId =
      newManualData.resourcesToAttributions['/something.js'][0];

    expect(newAttributionId).not.toBe('reactUuid');
    expect(newManualData.attributions[newAttributionId]).toEqual({
      ...updatedPackageInfo,
      id: newAttributionId,
    });
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
  function prepareTestStore() {
    const testStore = createAppStore();
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
        id: faker.string.uuid(),
      }),
    );
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setTargetView(View.Attribution));
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
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

  it('sets TargetSelectedResourceOrAttribution', () => {
    const state = prepareTestState();
    expect(getSelectedResourceId(state)).toBe('newSelectedResource');
  });

  it('sets View', () => {
    const state = prepareTestState();
    expect(getSelectedView(state)).toBe(View.Attribution);
  });

  it('closes popup', () => {
    const state = prepareTestState();
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
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toMatchObject<
      Partial<PackageInfo>
    >({
      packageName: 'Test',
    });
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);
  });
});

describe('closePopupAndReopenEditAttributionPopupIfItWasPreviouslyOpen', () => {
  it.each([[View.Audit], [View.Attribution]])(
    'closes popup and unsets targets in % view',
    (view: View) => {
      const testStore = createAppStore();
      testStore.dispatch(navigateToView(view));
      if (view === View.Attribution) {
        testStore.dispatch(setSelectedAttributionId('id1'));
      }
      if (view === View.Audit) {
        const testSelectedPackage: PanelPackage = {
          panel: PackagePanelTitle.AllAttributions,
          packageCardId: 'All Attributions-0',
          displayPackageInfo: {
            id: 'id1',
          },
        };
        testStore.dispatch(setDisplayedPackage(testSelectedPackage));
      }
      testStore.dispatch(openPopup(PopupType.NotSavedPopup));

      testStore.dispatch(closePopupAndUnsetTargets());
      expect(getTargetView(testStore.getState())).toBeNull();
      expect(getTargetSelectedResourceId(testStore.getState())).toBe('');
      expect(getTargetSelectedAttributionId(testStore.getState())).toBe('');
      expect(getOpenPopup(testStore.getState())).toBeFalsy();
    },
  );

  it('closes popup and unsets targets', () => {
    const testStore = createAppStore();
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));

    testStore.dispatch(closePopupAndUnsetTargets());
    expect(getTargetView(testStore.getState())).toBeNull();
    expect(getTargetSelectedResourceId(testStore.getState())).toBe('');
    expect(getTargetSelectedAttributionId(testStore.getState())).toBe('');
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });
});

describe('locateSignalsFromLocatorPopup', () => {
  it('sets showNoSignalsLocatedMessage if no resources are found and does not change view', () => {
    const testStore = createAppStore();
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
    const testStore = createAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'GPL-2.0',
        id: 'uuid1',
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
    const testStore = createAppStore();
    const testInitialPackageInfo: PackageInfo = {
      packageName: 'react',
      packageVersion: '18',
      id: 'uuid',
    };
    const testManualAttributions: Attributions = {
      uuid: testInitialPackageInfo,
    };
    const changedDisplayPackageInfo: PackageInfo = {
      packageName: 'react',
      packageVersion: '19',
      id: 'uuid',
    };
    const testExternalAttributions: Attributions = {
      uuid_ext: {
        packageName: 'vue',
        licenseName: 'GPL-2.0',
        criticality: Criticality.High,
        id: 'uuid_ext',
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
    const testStore = createAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        licenseName: 'Apache-2.0',
        id: 'uuid1',
      },
      uuid2: {
        licenseName: 'Apache 2.0',
        id: 'uuid2',
      },
      uuid3: {
        licenseName: 'MIT',
        id: 'uuid3',
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
    const testStore = createAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'MIT',
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'angular',
        criticality: Criticality.Medium,
        licenseName: 'MIT',
        id: 'uuid2',
      },
      uuid3: {
        packageName: 'vue',
        licenseName: 'MIT',
        id: 'uuid3',
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
    const testStore = createAppStore();
    const testExternalAttributions: Attributions = {
      uuid1: {
        packageName: 'react',
        criticality: Criticality.High,
        licenseName: 'GPL-2.0',
        id: 'uuid1',
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
    const testStore = createAppStore();
    const testInitialPackageInfo: PackageInfo = {
      packageName: 'react',
      packageVersion: '18',
      id: 'uuid',
    };
    const testManualAttributions: Attributions = {
      uuid: testInitialPackageInfo,
    };
    const changedDisplayPackageInfo: PackageInfo = {
      packageName: 'react',
      packageVersion: '19',
      id: 'uuid',
    };
    const testExternalAttributions: Attributions = {
      uuid_ext: {
        packageName: 'vue',
        licenseName: 'GPL-2.0',
        id: 'uuid_ext',
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
    testStore.dispatch(locateSignalsFromProjectStatisticsPopup('GPL-2.0'));
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    testStore.dispatch(
      unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();
    expect(getSelectedView(testStore.getState())).toBe(View.Audit);
  });
});
