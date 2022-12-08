// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  SaveFileArgs,
} from '../../../../../shared/shared-types';
import { PackagePanelTitle, PopupType } from '../../../../enums/enums';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import {
  getAttributionIdMarkedForReplacement,
  getManualAttributions,
  getManualAttributionsToResources,
  getManualData,
  getPackageInfoOfSelected,
  getResourcesToManualAttributions,
  getResourcesWithManualAttributedChildren,
  getTemporaryPackageInfo,
  wereTemporaryPackageInfoModified,
} from '../../../selectors/all-views-resource-selectors';
import {
  getMultiSelectSelectedAttributionIds,
  getSelectedAttributionId,
} from '../../../selectors/attribution-view-resource-selectors';
import { getAttributionIdOfDisplayedPackageInManualPanel } from '../../../selectors/audit-view-resource-selectors';
import {
  setResources,
  setTemporaryPackageInfo,
} from '../all-views-simple-actions';
import {
  setAttributionIdMarkedForReplacement,
  setMultiSelectSelectedAttributionIds,
  setSelectedAttributionId,
} from '../attribution-view-simple-actions';
import {
  addResolvedExternalAttribution,
  setDisplayedPackage,
  setSelectedResourceId,
} from '../audit-view-simple-actions';
import { loadFromFile } from '../load-actions';
import {
  addToSelectedResource,
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
  saveManualAndResolvedAttributionsToFile,
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
  setIsSavingDisabled,
  unlinkAttributionAndSavePackageInfo,
} from '../save-actions';
import { getOpenPopup } from '../../../selectors/view-selector';

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
const testExternalAttributions: Attributions = {
  uuid_1: { copyright: '2020' },
};
const testResourcesToExternalAttributions: ResourcesToAttributions = {
  '/root/src/something.js': ['uuid_1'],
  '/root/readme.md': ['uuid_1'],
};

describe('The savePackageInfo action', () => {
  it('does not save if saving is disabled', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );
    testStore.dispatch(setSelectedResourceId('/root/src/'));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);
    testStore.dispatch(setIsSavingDisabled(true));

    testStore.dispatch(
      savePackageInfoIfSavingIsNotDisabled(
        '/root/src/something.js',
        getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
        testTemporaryPackageInfo
      )
    );
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.UnableToSavePopup
    );
  });

  it('throws an error if resource is a breakpoint', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      packageName: 'test Package',
    };
    const testAttributionBreakpoints = new Set(['/my/src/']);

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          attributionBreakpoints: testAttributionBreakpoints,
        })
      )
    );

    testStore.dispatch(setSelectedResourceId('/my/src/'));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);

    expect(() =>
      testStore.dispatch(
        savePackageInfo(
          '/my/src/',
          getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
          testTemporaryPackageInfo
        )
      )
    ).toThrow('/my/src/ is a breakpoint, saving not allowed');
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);
  });

  it('creates a new attribution', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const expectedTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionConfidence: DiscreteConfidence.High,
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );

    testStore.dispatch(setSelectedResourceId('/root/src/'));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    expect(getManualAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({});
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual({});
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(
      savePackageInfo('/root/src/', null, testTemporaryPackageInfo)
    );
    expect(getPackageInfoOfSelected(testStore.getState())).toEqual(
      expectedTemporaryPackageInfo
    );
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual({
      '/': new Set().add('/root/src/'),
      '/root/': new Set().add('/root/src/'),
    });
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
  });

  it('updates an attribution', () => {
    const testStore = createTestAppStore();
    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionConfidence: DiscreteConfidence.Low,
    };

    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual({
      '/': new Set().add('/root/src/something.js'),
      '/root/': new Set().add('/root/src/something.js'),
      '/root/src/': new Set().add('/root/src/something.js'),
    });

    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(
      savePackageInfo(
        '/root/src/something.js',
        getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState()),
        testTemporaryPackageInfo
      )
    );

    expect(getPackageInfoOfSelected(testStore.getState())).toEqual(
      testTemporaryPackageInfo
    );
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual({
      '/': new Set().add('/root/src/something.js'),
      '/root/': new Set().add('/root/src/something.js'),
      '/root/src/': new Set().add('/root/src/something.js'),
    });
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
  });

  it('removes an attribution', () => {
    const testUuidA = '8ef8dff4-8e9d-4cab-b70b-44fa498957a9';
    const testUuidB = 'd8ff89ae-34d0-4899-9519-7f736e7fd7da';
    const testResources: Resources = {
      root: { src: { 'something.js': 1 }, 'somethingElse.js': 1 },
    };
    const testManualAttributions: Attributions = {
      [testUuidA]: {
        packageVersion: '1.0',
        packageName: 'test Package',
        licenseText: ' test License text',
      },
      [testUuidB]: {
        packageVersion: '1.0',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testUuidA],
      '/root/somethingElse.js': [testUuidB],
    };
    const expectedResourcesWithManualAttributedChildren1: ResourcesWithAttributedChildren =
      {
        '/': new Set<string>()
          .add('/root/src/something.js')
          .add('/root/somethingElse.js'),
        '/root/': new Set<string>()
          .add('/root/src/something.js')
          .add('/root/somethingElse.js'),
        '/root/src/': new Set<string>().add('/root/src/something.js'),
      };
    const expectedResourcesWithManualAttributedChildren2: ResourcesWithAttributedChildren =
      {
        '/': new Set<string>().add('/root/somethingElse.js'),
        '/root/': new Set<string>().add('/root/somethingElse.js'),
      };
    const emptyTestTemporaryPackageInfo: PackageInfo = {};

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setSelectedAttributionId(testUuidA));
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual(expectedResourcesWithManualAttributedChildren1);

    testStore.dispatch(setTemporaryPackageInfo(emptyTestTemporaryPackageInfo));
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(
      savePackageInfo(
        '/root/src/something.js',
        testUuidA,
        emptyTestTemporaryPackageInfo
      )
    );
    expect(getManualAttributions(testStore.getState())[testUuidA]).toBe(
      undefined
    );
    expect(
      getResourcesToManualAttributions(testStore.getState())[
        '/root/src/something.js'
      ]
    ).toBe(undefined);
    expect(getSelectedAttributionId(testStore.getState())).toBe('');
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState())
    ).toEqual(expectedResourcesWithManualAttributedChildren2);
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(false);
  });

  it('removes an attribution keeping the selectedAttributionId when the attribution still exists', () => {
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
      },
      uuid2: {
        packageName: 'Vue',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
      '/somethingElse.js': ['uuid2'],
    };
    const emptyTestTemporaryPackageInfo: PackageInfo = {};

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
    testStore.dispatch(setSelectedResourceId('/something.js'));
    testStore.dispatch(setSelectedAttributionId('uuid2'));

    testStore.dispatch(setTemporaryPackageInfo(emptyTestTemporaryPackageInfo));
    testStore.dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        attributionId: 'uuid1',
      })
    );
    expect(wereTemporaryPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(
      savePackageInfo('/something.js', null, emptyTestTemporaryPackageInfo)
    );
    expect(getSelectedAttributionId(testStore.getState())).toBe('uuid2');
  });

  it('cleans up multiSelectSelectedAttributionIds if attribution was removed', () => {
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
    testStore.dispatch(
      setMultiSelectSelectedAttributionIds([testManualAttributionUuid_1])
    );
    testStore.dispatch(savePackageInfo(null, testManualAttributionUuid_1, {}));
    expect(
      getMultiSelectSelectedAttributionIds(testStore.getState())
    ).toStrictEqual([]);
  });

  it('removes an attribution from child and removes all remaining attributions if parent has identical ones', () => {
    const testResources: Resources = {
      parent: {
        'child.js': 1,
      },
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
      },
      uuid2: {
        packageName: 'Vue',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/': ['uuid1'],
      '/parent/child.js': ['uuid2', 'uuid1'],
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

    testStore.dispatch(savePackageInfo('/parent/child.js', 'uuid2', {}));
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({
      '/parent/': ['uuid1'],
    });
  });

  it('removes an attribution from parent and removes all remaining attributions from child if has now same of parent', () => {
    const testResources: Resources = {
      parent: {
        'child.js': 1,
      },
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
      },
      uuid2: {
        packageName: 'Vue',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/': ['uuid1', 'uuid2'],
      '/parent/child.js': ['uuid1'],
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

    testStore.dispatch(savePackageInfo('/parent/', 'uuid2', {}));
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({
      '/parent/': ['uuid1'],
    });
  });

  it('replaces an attribution with an existing one', () => {
    const testPackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      uuid1: testPackageInfo,
      toReplaceUuid: { packageName: 'Vue' },
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
      '/somethingElse.js': ['toReplaceUuid'],
    };
    const expectedManualData: AttributionData = {
      attributions: {
        uuid1: testPackageInfo,
      },
      resourcesToAttributions: {
        '/something.js': ['uuid1'],
        '/somethingElse.js': ['uuid1'],
      },
      attributionsToResources: {
        uuid1: ['/something.js', '/somethingElse.js'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set()
          .add('/something.js')
          .add('/somethingElse.js') as Set<string>,
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
          externalAttributions: { uuid_1: { copyright: 'copyright' } },
          resourcesToExternalAttributions: { '/somethingElse.js': ['uuid_1'] },
        })
      )
    );

    testStore.dispatch(
      setMultiSelectSelectedAttributionIds(['toReplaceUuid', 'uuid1'])
    );
    testStore.dispatch(
      savePackageInfo(
        '/somethingElse.js',
        'toReplaceUuid',
        testPackageInfo,
        false
      )
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getSelectedAttributionId(testStore.getState())).toEqual('uuid1');
    expect(
      getMultiSelectSelectedAttributionIds(testStore.getState())
    ).toStrictEqual(['uuid1']);
  });

  it('links to an attribution when the attribution already exists', () => {
    const testUuid = '8ef8dff4-8e9d-4cab-b70b-44fa498957a9';
    const testPackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
    };
    const testResources: Resources = {
      'something.js': 1,
      folder: { 'somethingElse.js': 1 },
    };
    const testManualAttributions: Attributions = {
      [testUuid]: testPackageInfo,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': [testUuid],
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder/somethingElse.js': ['uuid_1'],
    };
    const expectedManualData: AttributionData = {
      attributions: testManualAttributions,
      resourcesToAttributions: {
        '/something.js': [testUuid],
        '/folder/somethingElse.js': [testUuid],
      },
      attributionsToResources: {
        [testUuid]: ['/something.js', '/folder/somethingElse.js'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set<string>()
          .add('/something.js')
          .add('/folder/somethingElse.js'),
        '/folder/': new Set<string>().add('/folder/somethingElse.js'),
      },
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );

    testStore.dispatch(
      savePackageInfo('/folder/somethingElse.js', null, testPackageInfo)
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
  });

  it('removes an attribution and keeps temporary package info for selected attribution', () => {
    const testUuidA = '8ef8dff4-8e9d-4cab-b70b-44fa498957a9';
    const testUuidB = 'd8ff89ae-34d0-4899-9519-7f736e7fd7da';
    const testResources: Resources = {
      root: { src: { 'something.js': 1 }, 'somethingElse.js': 1 },
    };
    const testManualAttributions: Attributions = {
      [testUuidA]: {
        packageVersion: '1.0',
        packageName: 'test Package',
        licenseText: ' test License text',
      },
      [testUuidB]: { packageName: 'second test Package' },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testUuidA, testUuidB],
      '/root/somethingElse.js': [testUuidB],
    };

    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.0',
      packageName: 'test Package modified',
      licenseText: ' test License text',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setSelectedAttributionId(testUuidA));

    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    testStore.dispatch(
      savePackageInfo('/root/src/something.js', testUuidB, {}, true)
    );
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testTemporaryPackageInfo
    );
  });

  it('replaces an attribution with an existing one, keeps temporary package info for selected attribution and stay at selected attribution', () => {
    const testPackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      uuid1: testPackageInfo,
      toReplaceUuid: { packageName: 'Vue' },
      uuid2: { packageName: 'second test Package' },
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
      '/somethingElse.js': ['toReplaceUuid', 'uuid2'],
    };

    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.0',
      packageName: 'test Package modified',
      licenseText: ' test License text',
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testInitialManualAttributions,
          resourcesToManualAttributions:
            testInitialResourcesToManualAttributions,
          externalAttributions: { uuid_1: { copyright: 'copyright' } },
          resourcesToExternalAttributions: { '/somethingElse.js': ['uuid_1'] },
        })
      )
    );
    testStore.dispatch(setSelectedAttributionId('uuid2'));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    testStore.dispatch(
      setMultiSelectSelectedAttributionIds(['toReplaceUuid', 'uuid1'])
    );
    testStore.dispatch(
      savePackageInfo(
        '/somethingElse.js',
        'toReplaceUuid',
        testPackageInfo,
        true
      )
    );
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testTemporaryPackageInfo
    );
    expect(getSelectedAttributionId(testStore.getState())).toBe('uuid2');
  });

  it('creates a new attribution, keeps temporary package info for selected attribution and stay at selected attribution', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
    };

    const testPackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
    };
    const testResources: Resources = {
      'something.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      uuid1: testPackageInfo,
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testInitialManualAttributions,
          resourcesToManualAttributions:
            testInitialResourcesToManualAttributions,
          externalAttributions: testExternalAttributions,
          resourcesToExternalAttributions: testResourcesToExternalAttributions,
        })
      )
    );

    testStore.dispatch(setSelectedResourceId('/something.js'));
    testStore.dispatch(
      setDisplayedPackage({
        panel: PackagePanelTitle.ManualPackages,
        attributionId: 'uuid1',
      })
    );
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    testStore.dispatch(savePackageInfo('/something.js', null, {}, true));
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testTemporaryPackageInfo
    );
    expect(
      getAttributionIdOfDisplayedPackageInManualPanel(testStore.getState())
    ).toBe('uuid1');
  });

  it('updates an attribution and keeps temporary package info for selected attribution', () => {
    const testStore = createTestAppStore();
    const testTemporaryPackageInfo: PackageInfo = {
      packageName: 'test Package modified',
    };
    const packageInfoToUpdate = {
      ...secondTestTemporaryPackageInfo,
      preselected: false,
    };
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    testStore.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    testStore.dispatch(
      savePackageInfo(
        null,
        testManualAttributionUuid_2,
        packageInfoToUpdate,
        true
      )
    );

    expect(getTemporaryPackageInfo(testStore.getState())).toEqual(
      testTemporaryPackageInfo
    );
  });
});

describe('The unlinkAttributionAndSavePackageInfo action', () => {
  it('saves attribution updates for a single resource', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
    };
    const testVue: PackageInfo = {
      packageName: 'Vue',
      attributionConfidence: DiscreteConfidence.Low,
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      reactUuid: testReact,
      vueUuid: testVue,
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['reactUuid'],
      '/somethingElse.js': ['reactUuid'],
    };
    const expectedManualData: AttributionData = {
      attributions: testInitialManualAttributions,
      resourcesToAttributions: {
        '/something.js': ['vueUuid'],
        '/somethingElse.js': ['reactUuid'],
      },
      attributionsToResources: {
        reactUuid: ['/somethingElse.js'],
        vueUuid: ['/something.js'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set()
          .add('/something.js')
          .add('/somethingElse.js') as Set<string>,
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

    testStore.dispatch(
      unlinkAttributionAndSavePackageInfo('/something.js', 'reactUuid', testVue)
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
  });
});

describe('The deleteAttributionAndSave action', () => {
  it('unlinks resource from attribution with single linked attribution', () => {
    const testResources: Resources = {
      file1: 1,
    };
    const testAttributions: Attributions = {
      toUnlink: { packageName: 'Vue' },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file1': ['toUnlink'],
    };
    const expectedManualData: AttributionData = {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
      resourcesWithAttributedChildren: {},
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

    testStore.dispatch(deleteAttributionAndSave('/file1', 'toUnlink'));
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
  });

  it('deletes attributions from multiSelectSelectedAttributionIds', () => {
    const testResources: Resources = {
      file1: 1,
    };
    const testAttributions: Attributions = {
      toUnlink: { packageName: 'Vue' },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file1': ['toUnlink'],
    };
    const expectedManualData: AttributionData = {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
      resourcesWithAttributedChildren: {},
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
    testStore.dispatch(setMultiSelectSelectedAttributionIds(['toUnlink']));

    testStore.dispatch(deleteAttributionAndSave('/file1', 'toUnlink'));
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(
      getMultiSelectSelectedAttributionIds(testStore.getState())
    ).toStrictEqual([]);
  });

  it('unlinks resource from attribution multiple linked attribution', () => {
    const testResources: Resources = {
      file1: 1,
    };
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React' },
      toUnlink: { packageName: 'Vue' },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file1': ['uuid1', 'toUnlink'],
    };
    const expectedManualAttributions: Attributions = {
      uuid1: { packageName: 'React' },
    };
    const expectedManualData: AttributionData = {
      attributions: expectedManualAttributions,
      resourcesToAttributions: {
        '/file1': ['uuid1'],
      },
      attributionsToResources: {
        uuid1: ['/file1'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set<string>().add('/file1'),
      },
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

    testStore.dispatch(deleteAttributionAndSave('/file1', 'toUnlink'));
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual({});
  });
});

describe('The deleteAttributionGloballyAndSave action', () => {
  it('deletes attribution', () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
    };
    const testVue: PackageInfo = {
      packageName: 'Vue',
      attributionConfidence: DiscreteConfidence.Low,
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      reactUuid: testReact,
      vueUuid: testVue,
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['reactUuid'],
      '/somethingElse.js': ['reactUuid', 'vueUuid'],
    };
    const expectedManualAttributions: Attributions = {
      vueUuid: testVue,
    };
    const expectedManualData: AttributionData = {
      attributions: expectedManualAttributions,
      resourcesToAttributions: {
        '/somethingElse.js': ['vueUuid'],
      },
      attributionsToResources: {
        vueUuid: ['/somethingElse.js'],
      },
      resourcesWithAttributedChildren: {
        '/': new Set().add('/somethingElse.js') as Set<string>,
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
    testStore.dispatch(setSelectedAttributionId('reactUuid'));
    testStore.dispatch(setAttributionIdMarkedForReplacement('reactUuid'));
    testStore.dispatch(setMultiSelectSelectedAttributionIds(['reactUuid']));

    testStore.dispatch(deleteAttributionGloballyAndSave('reactUuid'));
    expect(
      getMultiSelectSelectedAttributionIds(testStore.getState())
    ).toStrictEqual([]);
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getTemporaryPackageInfo(testStore.getState())).toEqual({});
    expect(getSelectedAttributionId(testStore.getState())).toEqual('');
    expect(getAttributionIdMarkedForReplacement(testStore.getState())).toEqual(
      ''
    );
  });
});

describe('The addToSelectedResource action', () => {
  it('links an already existing manual attribution to the selected resource', () => {
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
    expect(
      getManualAttributionsToResources(testStore.getState())[
        testManualAttributionUuid_1
      ]
    ).toEqual(['/root/src/something.js']);

    testStore.dispatch(addToSelectedResource(testTemporaryPackageInfo));
    const manualData: AttributionData = getManualData(testStore.getState());
    expect(manualData.resourcesToAttributions['/root/']).toEqual([
      testManualAttributionUuid_1,
    ]);
    expect(
      manualData.attributionsToResources[testManualAttributionUuid_1]
    ).toEqual(['/root/']);
    expect(getPackageInfoOfSelected(testStore.getState())).toEqual(
      testManualAttributions[testManualAttributionUuid_1]
    );
    expect(getOpenPopup(testStore.getState())).toBe(null);
  });

  it('opens popup', () => {
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
    expect(
      getManualAttributionsToResources(testStore.getState())[
        testManualAttributionUuid_1
      ]
    ).toEqual(['/root/src/something.js']);

    testStore.dispatch(setTemporaryPackageInfo({ packageName: 'modified' }));
    testStore.dispatch(addToSelectedResource(testTemporaryPackageInfo));
    expect(getOpenPopup(testStore.getState())).toEqual('NotSavedPopup');
  });

  it('adds an external attribution to the selected resource', () => {
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

    const testPackageInfo: PackageInfo = {
      attributionConfidence: 30,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseName: 'test License name',
      licenseText: ' test License text',
      url: 'test url',
      copyright: 'test copyright',
      comment: 'Comment of signal',
    };
    testStore.dispatch(addToSelectedResource(testPackageInfo));

    const manualData: AttributionData = getManualData(testStore.getState());
    expect(manualData.resourcesToAttributions['/root/'].length).toEqual(1);
    const uuidNewAttribution: string =
      manualData.resourcesToAttributions['/root/'][0];
    expect(manualData.attributionsToResources[uuidNewAttribution]).toEqual([
      '/root/',
    ]);
    const expectedModifiedPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseName: 'test License name',
      licenseText: ' test License text',
      url: 'test url',
      copyright: 'test copyright',
      comment: 'Comment of signal',
    };
    expect(manualData.attributions[uuidNewAttribution]).toEqual(
      expectedModifiedPackageInfo
    );
    expect(getPackageInfoOfSelected(testStore.getState())).toEqual(
      expectedModifiedPackageInfo
    );
    expect(getOpenPopup(testStore.getState())).toBe(null);
  });

  it('saves resolved external attributions', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setResources({}));
    testStore.dispatch(
      addResolvedExternalAttribution('TestExternalAttribution')
    );
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {},
      resolvedExternalAttributions: new Set<string>().add(
        'TestExternalAttribution'
      ),
      resourcesToAttributions: {},
    };

    testStore.dispatch(saveManualAndResolvedAttributionsToFile());
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs
    );
  });
});
