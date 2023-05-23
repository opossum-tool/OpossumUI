// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle, PopupType, View } from '../../../../enums/enums';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import {
  getManualAttributions,
  getManualData,
  getTemporaryDisplayPackageInfo,
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
  openAttributionWizardPopup,
  saveTemporaryDisplayPackageInfoAndNavigateToTargetView,
  selectPackageCardInAuditViewOrOpenUnsavedPopup,
  setSelectedResourceIdOrOpenUnsavedPopup,
  setViewOrOpenUnsavedPopup,
  unlinkAttributionAndSavePackageInfoAndNavigateToTargetView,
} from '../popup-actions';
import { PanelPackage, State } from '../../../../types/types';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import {
  AttributionData,
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
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
  setExternalData,
  setManualData,
  setResources,
  setTemporaryDisplayPackageInfo,
} from '../../resource-actions/all-views-simple-actions';
import {
  getDisplayedPackage,
  getExpandedIds,
  getSelectedResourceId,
  getTargetSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import {
  getSelectedAttributionIdInAttributionView,
  getTargetSelectedAttributionId,
} from '../../../selectors/attribution-view-resource-selectors';
import { act } from 'react-dom/test-utils';
import {
  getAttributionWizarOriginalDisplayPackageInfo,
  getAttributionWizardPackageNamespaces,
  getAttributionWizardPackageNames,
  getAttributionWizardPackageVersions,
  getAttributionWizardSelectedPackageAttributeIds,
  getAttributionWizardTotalAttributionCount,
} from '../../../selectors/attribution-wizard-selectors';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../../shared-constants';
import { convertDisplayPackageInfoToPackageInfo } from '../../../../util/convert-package-info';

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
            })
          )
        );

        testStore.dispatch(setSelectedResourceId('selectedResource'));
        testStore.dispatch(navigateToView(View.Attribution));
        testStore.dispatch(
          savePackageInfo(null, null, { packageName: 'Test' })
        );
        testStore.dispatch(
          setTemporaryDisplayPackageInfo({
            packageName: 'Test 2',
            attributionIds: [],
          })
        );

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
        expect(
          getSelectedAttributionIdInAttributionView(testStore.getState())
        ).toBe('');
        expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual({
          packageName: 'Test 2',
          attributionIds: [],
        });
      }
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
          })
        )
      );

      testStore.dispatch(setSelectedResourceId('selectedResource'));
      testStore.dispatch(setSelectedAttributionId('selectedAttributionId'));
      testStore.dispatch(navigateToView(View.Attribution));
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          attributionIds: [],
        })
      );
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
      expect(
        getSelectedAttributionIdInAttributionView(testStore.getState())
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
        })
      );
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
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'new Name',
          attributionIds: [],
        })
      );
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
          })
        )
      );

      expect(getDisplayedPackage(testStore.getState())).toBeNull();

      testStore.dispatch(
        selectPackageCardInAuditViewOrOpenUnsavedPopup(
          testSelectedPackage.panel,
          testSelectedPackage.packageCardId,
          testSelectedPackage.displayPackageInfo
        )
      );
      expect(getDisplayedPackage(testStore.getState())).toEqual(
        testSelectedPackage
      );
      expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
        testDisplayPackageInfo
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
          })
        )
      );

      expect(getDisplayedPackage(testStore.getState())).toBeNull();

      testStore.dispatch(
        selectPackageCardInAuditViewOrOpenUnsavedPopup(
          testSelectedPackage.panel,
          testSelectedPackage.packageCardId,
          testSelectedPackage.displayPackageInfo
        )
      );
      expect(getDisplayedPackage(testStore.getState())).toEqual(
        testSelectedPackage
      );
      expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual({
        ...testPackageInfo,
        attributionIds: ['uuid'],
      });
    });
  });
});

describe('The actions called from the unsaved popup', () => {
  describe('unlinkAttributionAndSavePackageInfoAndNavigateToTargetView', () => {
    it('unlinks and navigates to target view', () => {
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
          packageCardId: testPackageCardId,
          displayPackageInfo: testDisplayPackageInfo,
        })
      );
      testStore.dispatch(
        setTemporaryDisplayPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO)
      );
      testStore.dispatch(setTargetView(View.Attribution));
      expect(getSelectedView(testStore.getState())).toBe(View.Audit);

      testStore.dispatch(
        unlinkAttributionAndSavePackageInfoAndNavigateToTargetView()
      );
      expect(getManualData(testStore.getState())).toEqual(expectedManualData);
      expect(getSelectedView(testStore.getState())).toBe(View.Attribution);
    });
  });

  describe('saveTemporaryDisplayPackageInfoAndNavigateToTargetView', () => {
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
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          attributionIds: [],
        })
      );
      testStore.dispatch(navigateToView(View.Audit));
      testStore.dispatch(setTargetView(View.Attribution));
      testStore.dispatch(openPopup(PopupType.NotSavedPopup));
      testStore.dispatch(setTargetSelectedResourceId('newSelectedResource'));
      testStore.dispatch(
        saveTemporaryDisplayPackageInfoAndNavigateToTargetView()
      );

      return testStore.getState();
    }

    it('saves temporaryDisplayPackageInfo', () => {
      const state: State = prepareTestState();
      expect(getTemporaryDisplayPackageInfo(state)).toMatchObject({});
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
      testStore.dispatch(
        setTemporaryDisplayPackageInfo({
          packageName: 'Test',
          attributionIds: [],
        })
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
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
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
      testStore.getState()
    );
    const testPackageNames = getAttributionWizardPackageNames(
      testStore.getState()
    );
    const testPackageVersions = getAttributionWizardPackageVersions(
      testStore.getState()
    );
    const testSelectedPackageAttributeIds =
      getAttributionWizardSelectedPackageAttributeIds(testStore.getState());
    const testTotalAttributionCount = getAttributionWizardTotalAttributionCount(
      testStore.getState()
    );

    expect(
      convertDisplayPackageInfoToPackageInfo(testOriginalDisplayPackageInfo)
    ).toEqual(expectedOriginalAttribution);
    expect(Object.values(testPackageNamespaces)).toEqual(
      expectedPackageNamespacesValues
    );
    expect(Object.values(testPackageNames)).toEqual(expectedPackageNamesValues);
    Object.values(testPackageVersions).forEach((packageVersion, index) => {
      expect(packageVersion.text).toBe(
        expectedPackageVersionsValues[index].text
      );
      expect(packageVersion).toHaveProperty('relatedIds');
    });
    expect(testTotalAttributionCount).toBe(expectedTotalAttributionCount);
    expect(testSelectedPackageAttributeIds.namespaceId.length).toBeGreaterThan(
      0
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
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
    );
    act(() => {
      testStore.dispatch(openAttributionWizardPopup('uuid_0'));
    });
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.AttributionWizardPopup
    );
  });
});
