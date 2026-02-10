// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { executeCommand } from '../../../../../ElectronBackend/api/commands';
import { getDb } from '../../../../../ElectronBackend/db/db';
import {
  AttributionData,
  Attributions,
  Criticality,
  DiscreteConfidence,
  PackageInfo,
  ParsedFileContent,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  SaveFileArgs,
} from '../../../../../shared/shared-types';
import { faker } from '../../../../../testing/Faker';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../../shared-constants';
import { getParsedInputFileEnrichedWithTestData } from '../../../../test-helpers/general-test-helpers';
import { createTestStore } from '../../../../test-helpers/render';
import { createAppStore } from '../../../configure-store';
import {
  getIsPackageInfoModified,
  getManualAttributions,
  getManualAttributionsToResources,
  getManualData,
  getPackageInfoOfSelectedAttribution,
  getResourcesToManualAttributions,
  getResourcesWithManualAttributedChildren,
  getSelectedAttributionId,
  getTemporaryDisplayPackageInfo,
} from '../../../selectors/resource-selectors';
import { getOpenPopup } from '../../../selectors/view-selector';
import {
  setResources,
  setTemporaryDisplayPackageInfo,
} from '../all-views-simple-actions';
import {
  addResolvedExternalAttributions,
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../audit-view-simple-actions';
import {
  addToSelectedResource,
  deleteAttributionsAndSave,
  saveManualAndResolvedAttributionsToFile,
  savePackageInfo,
  unlinkAttributionAndSave,
  updateAttributionsAndSave,
} from '../save-actions';

/**
 * The database mutations are fired-and-forgotten.
 * We need to wait for them to clear before checking the changes.
 */
async function flushPendingMutations() {
  await new Promise(process.nextTick);
}

async function setupWithData(data: ParsedFileContent) {
  const testStore = await createTestStore(data);
  return { testStore, db: getDb() };
}

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
  criticality: Criticality.None,
  id: testManualAttributionUuid_1,
};
const secondTestPackageInfo: PackageInfo = {
  packageVersion: '2.0',
  packageName: 'not assigned test Package',
  licenseText: ' test not assigned License text',
  criticality: Criticality.None,
  id: testManualAttributionUuid_2,
};
const testManualAttributions: Attributions = {
  [testManualAttributionUuid_1]: testPackageInfo,
  [testManualAttributionUuid_2]: secondTestPackageInfo,
};
const testResourcesToManualAttributions: ResourcesToAttributions = {
  '/root/src/something.js': [testManualAttributionUuid_1],
};
const testExternalAttributions: Attributions = {
  uuid_1: {
    copyright: '2020',
    criticality: Criticality.None,
    id: 'uuid_1',
  },
};
const testResourcesToExternalAttributions: ResourcesToAttributions = {
  '/root/src/something.js': ['uuid_1'],
  '/root/readme.md': ['uuid_1'],
};

describe('The savePackageInfo action', () => {
  it('creates a new attribution', async () => {
    const expectedTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionConfidence: DiscreteConfidence.High,
      criticality: Criticality.None,
      id: expect.any(String),
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );

    testStore.dispatch(setSelectedResourceId('/root/src/'));
    testStore.dispatch(setTemporaryDisplayPackageInfo(testPackageInfo));
    expect(getManualAttributions(testStore.getState())).toEqual({});
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({});
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });
    expect(getIsPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(savePackageInfo('/root/src/', null, testPackageInfo));
    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      expectedTemporaryDisplayPackageInfo,
    );
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual({
      attributedChildren: {
        '1': new Set<number>().add(0),
        '2': new Set<number>().add(0),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/src/': 0,
      },
      paths: ['/root/src/', '/', '/root/'],
    });
    expect(getIsPackageInfoModified(testStore.getState())).toBe(false);

    await flushPendingMutations();

    // Verify DB: new attribution was created and linked
    const newAttributionId = getSelectedAttributionId(testStore.getState());
    const dbAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', newAttributionId)
      .executeTakeFirst();
    expect(dbAttribution).toBeDefined();
    expect(dbAttribution!.is_external).toBe(0);

    const dbLink = await db
      .selectFrom('resource_to_attribution')
      .selectAll()
      .where('attribution_uuid', '=', newAttributionId)
      .executeTakeFirst();
    expect(dbLink).toBeDefined();
  });

  it('updates an attribution', async () => {
    const testPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: testManualAttributionUuid_1,
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    testStore.dispatch(setTemporaryDisplayPackageInfo(testPackageInfo));
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual({
      attributedChildren: {
        '1': new Set().add(0),
        '2': new Set().add(0),
        '3': new Set().add(0),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/src/': 3,
        '/root/src/something.js': 0,
      },
      paths: ['/root/src/something.js', '/', '/root/', '/root/src/'],
    });

    expect(getIsPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(
      savePackageInfo(
        '/root/src/something.js',
        testManualAttributionUuid_1,
        testPackageInfo,
      ),
    );

    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      testPackageInfo,
    );
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual({
      attributedChildren: {
        '1': new Set<number>().add(0),
        '2': new Set<number>().add(0),
        '3': new Set<number>().add(0),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/src/': 3,
        '/root/src/something.js': 0,
      },
      paths: ['/root/src/something.js', '/', '/root/', '/root/src/'],
    });
    expect(getIsPackageInfoModified(testStore.getState())).toBe(false);

    await flushPendingMutations();

    // Verify DB: attribution data was updated
    const dbAttribution = await db
      .selectFrom('attribution')
      .select('data')
      .where('uuid', '=', testManualAttributionUuid_1)
      .executeTakeFirstOrThrow();
    expect(JSON.parse(dbAttribution.data)).toEqual(
      getManualAttributions(testStore.getState())[testManualAttributionUuid_1],
    );
  });

  it('removes an attribution', async () => {
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
        criticality: Criticality.None,
        id: testUuidA,
      },
      [testUuidB]: {
        packageVersion: '1.0',
        criticality: Criticality.None,
        id: testUuidB,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testUuidA],
      '/root/somethingElse.js': [testUuidB],
    };
    const expectedResourcesWithManualAttributedChildren1: ResourcesWithAttributedChildren =
      {
        attributedChildren: {
          '1': new Set<number>().add(0).add(4),
          '2': new Set<number>().add(0).add(4),
          '3': new Set<number>().add(0),
        },
        pathsToIndices: {
          '/': 1,
          '/root/': 2,
          '/root/somethingElse.js': 4,
          '/root/src/': 3,
          '/root/src/something.js': 0,
        },
        paths: [
          '/root/src/something.js',
          '/',
          '/root/',
          '/root/src/',
          '/root/somethingElse.js',
        ],
      };
    const expectedResourcesWithManualAttributedChildren2: ResourcesWithAttributedChildren =
      {
        attributedChildren: {
          '1': new Set<number>().add(0),
          '2': new Set<number>().add(0),
        },
        pathsToIndices: {
          '/': 1,
          '/root/': 2,
          '/root/somethingElse.js': 0,
        },
        paths: ['/root/somethingElse.js', '/', '/root/'],
      };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setSelectedAttributionId(testUuidA));
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual(expectedResourcesWithManualAttributedChildren1);

    testStore.dispatch(
      setTemporaryDisplayPackageInfo(EMPTY_DISPLAY_PACKAGE_INFO),
    );
    expect(getIsPackageInfoModified(testStore.getState())).toBe(true);

    testStore.dispatch(
      savePackageInfo('/root/src/something.js', testUuidA, {
        criticality: Criticality.None,
        id: testUuidA,
      }),
    );
    expect(
      getManualAttributions(testStore.getState())?.[testUuidA],
    ).toBeUndefined();
    expect(
      getResourcesToManualAttributions(testStore.getState())[
        '/root/src/something.js'
      ],
    ).toBeUndefined();
    expect(getSelectedAttributionId(testStore.getState())).toBe('');
    expect(
      getResourcesWithManualAttributedChildren(testStore.getState()),
    ).toEqual(expectedResourcesWithManualAttributedChildren2);
    expect(getIsPackageInfoModified(testStore.getState())).toBe(false);

    await flushPendingMutations();

    // Verify DB: attribution was deleted
    const dbAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', testUuidA)
      .executeTakeFirst();
    expect(dbAttribution).toBeUndefined();
  });

  it('removes an attribution from child and removes all remaining attributions if parent has identical ones', async () => {
    const testResources: Resources = {
      parent: {
        'child.js': 1,
      },
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        criticality: Criticality.None,
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Vue',
        criticality: Criticality.None,
        id: 'uuid2',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/': ['uuid1'],
      '/parent/child.js': ['uuid2', 'uuid1'],
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    testStore.dispatch(
      savePackageInfo('/parent/child.js', 'uuid2', {
        criticality: Criticality.None,
        id: 'uuid2',
      }),
    );
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({
      '/parent/': ['uuid1'],
    });

    await flushPendingMutations();

    // Verify DB: uuid2 was deleted
    const dbAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'uuid2')
      .executeTakeFirst();
    expect(dbAttribution).toBeUndefined();
  });

  it('removes an attribution from parent and removes all remaining attributions from child if has now same of parent', async () => {
    const testResources: Resources = {
      parent: {
        'child.js': 1,
      },
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        criticality: Criticality.None,
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Vue',
        criticality: Criticality.None,
        id: 'uuid2',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/parent/': ['uuid1', 'uuid2'],
      '/parent/child.js': ['uuid1'],
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    testStore.dispatch(
      savePackageInfo('/parent/', 'uuid2', {
        criticality: Criticality.None,
        id: 'uuid2',
      }),
    );
    expect(getResourcesToManualAttributions(testStore.getState())).toEqual({
      '/parent/': ['uuid1'],
    });

    await flushPendingMutations();

    // Verify DB: uuid2 was deleted
    const dbAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'uuid2')
      .executeTakeFirst();
    expect(dbAttribution).toBeUndefined();
  });

  it('replaces an attribution with an existing one', async () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
      criticality: Criticality.None,
      id: 'uuid1',
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      uuid1: testPackageInfo,
      toReplaceUuid: {
        packageName: 'Vue',
        criticality: Criticality.None,
        id: 'toReplaceUuid',
      },
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

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
        externalAttributions: {
          uuid_1: {
            copyright: 'copyright',
            criticality: Criticality.None,
            id: 'uuid_1',
          },
        },
        resourcesToExternalAttributions: { '/somethingElse.js': ['uuid_1'] },
      }),
    );

    testStore.dispatch(setSelectedAttributionId('uuid1'));
    testStore.dispatch(
      savePackageInfo(
        '/somethingElse.js',
        'toReplaceUuid',
        testPackageInfo,
        false,
      ),
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getSelectedAttributionId(testStore.getState())).toBe('uuid1');

    await flushPendingMutations();

    // Verify DB: old attribution deleted, links reassigned
    const dbOldAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'toReplaceUuid')
      .executeTakeFirst();
    expect(dbOldAttribution).toBeUndefined();

    const dbLinks = await db
      .selectFrom('resource_to_attribution')
      .selectAll()
      .where('attribution_uuid', '=', 'uuid1')
      .execute();
    expect(dbLinks).toHaveLength(2);
  });

  it('links to an attribution when the attribution already exists', async () => {
    const testUuid = '8ef8dff4-8e9d-4cab-b70b-44fa498957a9';
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: testUuid,
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
        attributedChildren: {
          '1': new Set<number>().add(0).add(2),
          '3': new Set<number>().add(2),
        },
        pathsToIndices: {
          '/': 1,
          '/folder/': 3,
          '/folder/somethingElse.js': 2,
          '/something.js': 0,
        },
        paths: ['/something.js', '/', '/folder/somethingElse.js', '/folder/'],
      },
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );

    testStore.dispatch(
      savePackageInfo('/folder/somethingElse.js', null, testPackageInfo),
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);

    await flushPendingMutations();

    // Verify DB: attribution is now linked to both resources
    const dbLinks = await db
      .selectFrom('resource_to_attribution')
      .selectAll()
      .where('attribution_uuid', '=', testUuid)
      .execute();
    expect(dbLinks).toHaveLength(2);
  });

  it('removes an attribution and keeps temporary package info for selected attribution', async () => {
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
        criticality: Criticality.None,
        id: testUuidA,
      },
      [testUuidB]: {
        packageName: 'second test Package',
        criticality: Criticality.None,
        id: testUuidB,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testUuidA, testUuidB],
      '/root/somethingElse.js': [testUuidB],
    };

    const testPackageInfo: PackageInfo = {
      packageVersion: '1.0',
      packageName: 'test Package modified',
      licenseText: ' test License text',
      criticality: Criticality.None,
      id: testUuidA,
    };

    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );
    testStore.dispatch(setSelectedResourceId('/root/src/something.js'));
    testStore.dispatch(setSelectedAttributionId(testUuidA));

    testStore.dispatch(setTemporaryDisplayPackageInfo(testPackageInfo));

    testStore.dispatch(
      savePackageInfo(
        '/root/src/something.js',
        testUuidB,
        { criticality: Criticality.None, id: testUuidB },
        true,
      ),
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testPackageInfo,
    );
  });

  it('replaces an attribution with an existing one, keeps temporary package info for selected attribution and stay at selected attribution', async () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
      criticality: Criticality.None,
      id: 'uuid1',
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      uuid1: testPackageInfo,
      toReplaceUuid: {
        packageName: 'Vue',
        criticality: Criticality.None,
        id: 'toReplaceUuid',
      },
      uuid2: {
        packageName: 'second test Package',
        criticality: Criticality.None,
        id: 'uuid2',
      },
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
      '/somethingElse.js': ['toReplaceUuid', 'uuid2'],
    };

    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '1.0',
      packageName: 'test Package modified',
      licenseText: ' test License text',
      criticality: Criticality.None,
      id: 'uuid2',
    };

    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
        externalAttributions: {
          uuid_1: {
            copyright: 'copyright',
            criticality: Criticality.None,
            id: 'uuid_1',
          },
        },
        resourcesToExternalAttributions: { '/somethingElse.js': ['uuid_1'] },
      }),
    );
    testStore.dispatch(setSelectedAttributionId('uuid2'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );
    testStore.dispatch(
      savePackageInfo(
        '/somethingElse.js',
        'toReplaceUuid',
        testPackageInfo,
        true,
      ),
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testTemporaryDisplayPackageInfo,
    );
    expect(getSelectedAttributionId(testStore.getState())).toBe('uuid2');
  });

  it('creates a new attribution, keeps temporary package info for selected attribution and stay at selected attribution', async () => {
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '1.1',
      packageName: 'test Package',
      licenseText: ' test License text',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.High,
      criticality: Criticality.None,
      id: 'uuid1',
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

    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
        externalAttributions: testExternalAttributions,
        resourcesToExternalAttributions: testResourcesToExternalAttributions,
      }),
    );

    testStore.dispatch(setSelectedResourceId('/something.js'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );
    testStore.dispatch(
      savePackageInfo(
        '/something.js',
        null,
        { criticality: Criticality.None, id: faker.string.uuid() },
        true,
      ),
    );
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testTemporaryDisplayPackageInfo,
    );
  });

  it('updates an attribution and keeps temporary package info for selected attribution', async () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'test Package modified',
      criticality: Criticality.None,
      id: testManualAttributionUuid_1,
    };
    const packageInfoToUpdate: PackageInfo = {
      ...secondTestPackageInfo,
      preSelected: false,
    };
    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    testStore.dispatch(setSelectedAttributionId(testManualAttributionUuid_1));
    testStore.dispatch(setTemporaryDisplayPackageInfo(testPackageInfo));

    testStore.dispatch(
      savePackageInfo(
        null,
        testManualAttributionUuid_2,
        packageInfoToUpdate,
        true,
      ),
    );

    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testPackageInfo,
    );
  });
});

describe('The unlinkAttributionAndSave action', () => {
  it('saves attribution updates for a single resource', async () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'reactUuid',
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

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
      }),
    );
    const startingManualAttributions = getManualAttributions(
      testStore.getState(),
    );
    expect(Object.keys(startingManualAttributions)).toHaveLength(1);
    const startingManualAttributionsToResources =
      getManualAttributionsToResources(testStore.getState());
    expect(startingManualAttributionsToResources.reactUuid).toEqual([
      '/something.js',
      '/somethingElse.js',
    ]);

    testStore.dispatch(
      unlinkAttributionAndSave('/something.js', ['reactUuid']),
    );
    const finalManualAttributionsToResources = getManualAttributionsToResources(
      testStore.getState(),
    );
    expect(finalManualAttributionsToResources.reactUuid).toEqual([
      '/somethingElse.js',
    ]);

    await flushPendingMutations();

    // Verify DB: link was removed
    const dbLinks = await db
      .selectFrom('resource_to_attribution')
      .selectAll()
      .where('attribution_uuid', '=', 'reactUuid')
      .execute();
    expect(dbLinks).toHaveLength(1);
  });
});

describe('The deleteAttributionsAndSave action', () => {
  it('unlinks resource from attribution with single linked attribution', async () => {
    const testResources: Resources = {
      file1: 1,
    };
    const testAttributions: Attributions = {
      toUnlink: {
        packageName: 'Vue',
        criticality: Criticality.None,
        id: 'toUnlink',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file1': ['toUnlink'],
    };
    const expectedManualData: AttributionData = {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
      resourcesWithAttributedChildren: {
        attributedChildren: {},
        pathsToIndices: {},
        paths: [],
      },
    };
    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    testStore.dispatch(deleteAttributionsAndSave(['toUnlink'], 'someId'));
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);

    await flushPendingMutations();

    // Verify DB: attribution was deleted
    const dbAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'toUnlink')
      .executeTakeFirst();
    expect(dbAttribution).toBeUndefined();
  });

  it('unlinks resource from attribution multiple linked attribution', async () => {
    const testResources: Resources = {
      file1: 1,
    };
    const testAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        criticality: Criticality.None,
        id: 'uuid1',
      },
      toUnlink: {
        packageName: 'Vue',
        criticality: Criticality.None,
        id: 'toUnlink',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/file1': ['uuid1', 'toUnlink'],
    };
    const expectedManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
        criticality: Criticality.None,
        id: 'uuid1',
      },
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
        attributedChildren: {
          '1': new Set<number>().add(0),
        },
        pathsToIndices: {
          '/': 1,
          '/file1': 0,
        },
        paths: ['/file1', '/'],
      },
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );

    testStore.dispatch(
      deleteAttributionsAndSave(['toUnlink'], 'someSelectedId'),
    );
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );

    await flushPendingMutations();

    // Verify DB: toUnlink deleted, uuid1 still exists
    const dbDeleted = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'toUnlink')
      .executeTakeFirst();
    expect(dbDeleted).toBeUndefined();

    const dbRemaining = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'uuid1')
      .executeTakeFirst();
    expect(dbRemaining).toBeDefined();
  });

  it('deletes multiple attributions and saves once', async () => {
    const testResourceSetup = createTestResources();

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData(testResourceSetup),
    );
    testStore.dispatch(setSelectedAttributionId('reactUuid'));

    // Clear the mock to ensure we count saves correctly
    jest.clearAllMocks();
    jest.mocked(window.electronAPI.api).mockImplementation(executeCommand);

    testStore.dispatch(
      deleteAttributionsAndSave(['reactUuid', 'vueUuid'], 'reactUuid'),
    );

    const expectedManualAttributions: Attributions = {
      angularUuid: testResourceSetup.manualAttributions.angularUuid,
    };
    const expectedManualData: AttributionData = {
      attributions: expectedManualAttributions,
      resourcesToAttributions: {
        '/anotherFile.js': ['angularUuid'],
      },
      attributionsToResources: {
        angularUuid: ['/anotherFile.js'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          '1': new Set<number>().add(0),
        },
        pathsToIndices: {
          '/': 1,
          '/anotherFile.js': 0,
        },
        paths: ['/anotherFile.js', '/'],
      },
    };

    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
    expect(getSelectedAttributionId(testStore.getState())).toBe('');
    // Verify file is saved only once
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);

    await flushPendingMutations();

    // Verify DB: both attributions deleted
    const dbAttributions = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', 'in', ['reactUuid', 'vueUuid'])
      .execute();
    expect(dbAttributions).toHaveLength(0);
  });

  it('deletes multiple attributions without clearing selected attribution or temp info if not in list', async () => {
    const testResourceSetup = createTestResources();

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData(testResourceSetup),
    );

    testStore.dispatch(setSelectedAttributionId('angularUuid'));

    const testTemporaryPackageInfo: PackageInfo = {
      packageName: 'Angular Modified',
      criticality: Criticality.None,
      id: 'angularUuid',
    };

    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryPackageInfo),
    );

    testStore.dispatch(
      deleteAttributionsAndSave(['reactUuid', 'vueUuid'], 'angularUuid'),
    );

    // Angular should still be selected since it wasn't deleted
    expect(getSelectedAttributionId(testStore.getState())).toBe('angularUuid');
    expect(
      getManualAttributions(testStore.getState()).angularUuid,
    ).toBeDefined();
    expect(
      getManualAttributions(testStore.getState()).reactUuid,
    ).toBeUndefined();
    expect(getManualAttributions(testStore.getState()).vueUuid).toBeUndefined();
    // Temporary display info should be preserved
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testTemporaryPackageInfo,
    );

    await flushPendingMutations();

    // Verify DB: angular still exists, others deleted
    const dbAngular = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'angularUuid')
      .executeTakeFirst();
    expect(dbAngular).toBeDefined();
  });

  function createTestResources() {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'reactUuid',
    };
    const testVue: PackageInfo = {
      packageName: 'Vue',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'vueUuid',
    };
    const testAngular: PackageInfo = {
      packageName: 'Angular',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'angularUuid',
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
      'anotherFile.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      reactUuid: testReact,
      vueUuid: testVue,
      angularUuid: testAngular,
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['reactUuid'],
      '/somethingElse.js': ['vueUuid'],
      '/anotherFile.js': ['angularUuid'],
    };

    return {
      resources: testResources,
      manualAttributions: testInitialManualAttributions,
      resourcesToManualAttributions: testInitialResourcesToManualAttributions,
    };
  }
});

describe('The deleteAttributionGloballyAndSave action', () => {
  it('deletes attribution', async () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'reactUuid',
    };
    const testVue: PackageInfo = {
      packageName: 'Vue',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'vueUuid',
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
        attributedChildren: {
          '1': new Set<number>().add(0),
        },
        pathsToIndices: {
          '/': 1,
          '/somethingElse.js': 0,
        },
        paths: ['/somethingElse.js', '/'],
      },
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
      }),
    );
    testStore.dispatch(setSelectedAttributionId('reactUuid'));

    testStore.dispatch(deleteAttributionsAndSave(['reactUuid'], 'someOtherId'));
    expect(getManualData(testStore.getState())).toEqual(expectedManualData);
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
    expect(getSelectedAttributionId(testStore.getState())).toBe('');

    await flushPendingMutations();

    // Verify DB: reactUuid deleted
    const dbAttribution = await db
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', '=', 'reactUuid')
      .executeTakeFirst();
    expect(dbAttribution).toBeUndefined();
  });
});

describe('The addToSelectedResource action', () => {
  it('links an already existing manual attribution to the selected resource', async () => {
    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
    );
    testStore.dispatch(setSelectedResourceId('/root/'));
    testStore.dispatch(setSelectedAttributionId(testPackageInfo.id));
    expect(
      getManualAttributionsToResources(testStore.getState())[
        testManualAttributionUuid_1
      ],
    ).toEqual(['/root/src/something.js']);

    testStore.dispatch(addToSelectedResource(testPackageInfo));
    const manualData = getManualData(testStore.getState());
    expect(manualData.resourcesToAttributions['/root/']).toEqual([
      testManualAttributionUuid_1,
    ]);
    expect(
      manualData.attributionsToResources[testManualAttributionUuid_1],
    ).toEqual(['/root/']);
    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      testPackageInfo,
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('adds an external attribution to the selected resource', async () => {
    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testManualAttributions,
        resourcesToManualAttributions: testResourcesToManualAttributions,
      }),
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
      criticality: Criticality.None,
      id: testManualAttributionUuid_1,
    };
    testStore.dispatch(addToSelectedResource(testPackageInfo));

    const manualData = getManualData(testStore.getState());
    expect(manualData.resourcesToAttributions['/root/']).toHaveLength(1);
    const uuidNewAttribution = manualData.resourcesToAttributions['/root/'][0];
    expect(manualData.attributionsToResources[uuidNewAttribution]).toEqual([
      '/root/',
    ]);
    const expectedModifiedPackageInfo: PackageInfo = {
      ...testPackageInfo,
      id: expect.any(String),
    };
    expect(manualData.attributions[uuidNewAttribution]).toEqual(
      expectedModifiedPackageInfo,
    );
    expect(getPackageInfoOfSelectedAttribution(testStore.getState())).toEqual(
      expectedModifiedPackageInfo,
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('saves resolved external attributions', () => {
    const testStore = createAppStore();
    testStore.dispatch(setResources({}));
    testStore.dispatch(
      addResolvedExternalAttributions(['TestExternalAttribution']),
    );
    const expectedSaveFileArgs: SaveFileArgs = {
      manualAttributions: {},
      resolvedExternalAttributions: new Set<string>().add(
        'TestExternalAttribution',
      ),
      resourcesToAttributions: {},
    };

    testStore.dispatch(saveManualAndResolvedAttributionsToFile());
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
      expectedSaveFileArgs,
    );
  });
});

describe('The updateAttributionsAndSave action', () => {
  it('updates multiple attributions and saves', async () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      packageVersion: '16.0.0',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'reactUuid',
    };
    const testVue: PackageInfo = {
      packageName: 'Vue',
      packageVersion: '2.0.0',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'vueUuid',
    };
    const testAngular: PackageInfo = {
      packageName: 'Angular',
      packageVersion: '10.0.0',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'angularUuid',
    };
    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
      'anotherFile.js': 1,
    };
    const testInitialManualAttributions: Attributions = {
      reactUuid: testReact,
      vueUuid: testVue,
      angularUuid: testAngular,
    };
    const testInitialResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['reactUuid'],
      '/somethingElse.js': ['vueUuid'],
      '/anotherFile.js': ['angularUuid'],
    };

    // Updated attributions with new versions
    const updatedReact: PackageInfo = {
      ...testReact,
      packageVersion: '17.0.0',
      attributionConfidence: DiscreteConfidence.High,
    };
    const updatedVue: PackageInfo = {
      ...testVue,
      packageVersion: '3.0.0',
      attributionConfidence: DiscreteConfidence.High,
    };
    const updatedAttributions: Attributions = {
      reactUuid: updatedReact,
      vueUuid: updatedVue,
    };

    const { testStore, db } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
      }),
    );

    // Clear the mock to ensure we count saves correctly
    jest.clearAllMocks();
    jest.mocked(window.electronAPI.api).mockImplementation(executeCommand);

    testStore.dispatch(updateAttributionsAndSave(updatedAttributions));

    // Verify the attributions were updated
    const finalManualAttributions = getManualAttributions(testStore.getState());
    expect(finalManualAttributions.reactUuid).toEqual(updatedReact);
    expect(finalManualAttributions.vueUuid).toEqual(updatedVue);
    expect(finalManualAttributions.angularUuid).toEqual(testAngular); // Should remain unchanged

    // Verify file is saved only once
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);

    await flushPendingMutations();

    // Verify DB: attributions were updated
    const dbReact = await db
      .selectFrom('attribution')
      .select('data')
      .where('uuid', '=', 'reactUuid')
      .executeTakeFirstOrThrow();
    expect(JSON.parse(dbReact.data)).toEqual(updatedReact);

    const dbVue = await db
      .selectFrom('attribution')
      .select('data')
      .where('uuid', '=', 'vueUuid')
      .executeTakeFirstOrThrow();
    expect(JSON.parse(dbVue.data)).toEqual(updatedVue);

    // Angular should remain unchanged in DB
    const dbAngular = await db
      .selectFrom('attribution')
      .select('data')
      .where('uuid', '=', 'angularUuid')
      .executeTakeFirstOrThrow();
    expect(JSON.parse(dbAngular.data)).toEqual(testAngular);
  });

  it('reloads temporary display package info when selected attribution is updated', async () => {
    const testReact: PackageInfo = {
      packageName: 'React',
      packageVersion: '16.0.0',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'reactUuid',
    };
    const testVue: PackageInfo = {
      packageName: 'Vue',
      packageVersion: '2.0.0',
      attributionConfidence: DiscreteConfidence.Low,
      criticality: Criticality.None,
      id: 'vueUuid',
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
      '/somethingElse.js': ['vueUuid'],
    };

    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageName: 'React Modified',
      packageVersion: '16.1.0',
      criticality: Criticality.None,
      id: 'reactUuid',
    };

    const { testStore } = await setupWithData(
      getParsedInputFileEnrichedWithTestData({
        resources: testResources,
        manualAttributions: testInitialManualAttributions,
        resourcesToManualAttributions: testInitialResourcesToManualAttributions,
      }),
    );

    testStore.dispatch(setSelectedAttributionId('reactUuid'));
    testStore.dispatch(
      setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
    );

    // Verify temporary display package info is set
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      testTemporaryDisplayPackageInfo,
    );

    // Update the selected attribution
    const updatedReact: PackageInfo = {
      ...testReact,
      packageVersion: '17.0.0',
    };
    const updatedAttributions: Attributions = {
      reactUuid: updatedReact,
    };

    testStore.dispatch(updateAttributionsAndSave(updatedAttributions));

    // Verify temporary display package info was reloaded
    expect(getTemporaryDisplayPackageInfo(testStore.getState())).toEqual(
      updatedReact,
    );
  });
});
