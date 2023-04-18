// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { createTestAppStore } from '../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { attributionForTemporaryPackageInfoExists } from '../save-action-helpers';
import { NIL as uuidNil } from 'uuid';
import {
  computeChildrenWithAttributions,
  createExternalAttributionsToHashes,
} from '../action-and-reducer-helpers';

describe('The attributionForTemporaryPackageInfoExists function', () => {
  it('checks if manual attributions exist', () => {
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
    const testManualAttributionUuid1 = '374ba87a-f68b-11ea-adc1-0242ac120002';
    const testManualAttributionUuid2 = '374bac4e-f68b-11ea-adc1-0242ac120002';
    const testManualAttributionUuid3 = '374bar8a-f68b-11ea-adc1-0242ac120002';
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid1]: {
        packageVersion: '1.0',
        packageName: 'Typescript',
        licenseText: ' test License text',
      },
      [testManualAttributionUuid2]: {
        packageVersion: '2.0',
        packageName: 'React',
        licenseText: ' test license text',
      },
      [testManualAttributionUuid3]: {
        packageVersion: '3.0',
        packageName: 'Vue',
        licenseText: ' test license text',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/': [testManualAttributionUuid1],
      '/root/src/': [testManualAttributionUuid2],
      '/thirdParty/': [testManualAttributionUuid3],
    };
    const testExistingPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'React',
      licenseText: ' test license text',
    };
    const testNotExistingPackageInfo: PackageInfo = {
      packageVersion: '4.0',
      packageName: 'React',
      licenseText: ' test license text',
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

    expect(
      attributionForTemporaryPackageInfoExists(
        testExistingPackageInfo,
        testStore.getState()
      )
    ).toBeTruthy();
    expect(
      attributionForTemporaryPackageInfoExists(
        testNotExistingPackageInfo,
        testStore.getState()
      )
    ).toBeFalsy();
  });
});

describe('computeChildrenWithAttributions', () => {
  it('parses ResourcesWithAttributionsFromDb', () => {
    const testUuid: string = uuidNil;
    const mockResourcesWithAttributionsFromDb: ResourcesToAttributions = {
      '/root/src/': [testUuid],
      '/root/src/something.js/subfolder': [testUuid],
    };
    const result = computeChildrenWithAttributions(
      mockResourcesWithAttributionsFromDb
    );

    expect(result).toEqual({
      attributedChildren: {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '0': new Set<number>().add(3),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '1': new Set<number>().add(0).add(3),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '2': new Set<number>().add(0).add(3),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '4': new Set<number>().add(3),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/src/': 0,
        '/root/src/something.js/': 4,
        '/root/src/something.js/subfolder': 3,
      },
      paths: [
        '/root/src/',
        '/',
        '/root/',
        '/root/src/something.js/subfolder',
        '/root/src/something.js/',
      ],
    });
  });
});

describe('createExternalAttributionsToHashes', () => {
  it('yields correct results', () => {
    const testExternalAttributions: Attributions = {
      uuid1: {
        attributionConfidence: 1,
        comment: 'comment1',
        packageName: 'name',
        originIds: ['abc'],
        preSelected: true,
      },
      uuid2: {
        attributionConfidence: 2,
        comment: 'comment2',
        packageName: 'name',
        originIds: ['def'],
        preSelected: false,
      },
      uuid3: {
        packageName: 'name',
      },
      uuid4: {
        licenseName: '',
        firstParty: true,
      },
      uuid5: {
        firstParty: true,
      },
      uuid6: {
        packageName: '',
      },
      uuid7: {
        firstParty: false,
      },
    };

    const testExternalAttributionsToHashes = createExternalAttributionsToHashes(
      testExternalAttributions
    );

    expect(testExternalAttributionsToHashes.uuid1).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid2).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid3).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid4).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid5).toBeDefined();
    expect(testExternalAttributionsToHashes.uuid6).toBeUndefined();
    expect(testExternalAttributionsToHashes.uuid7).toBeUndefined();

    expect(testExternalAttributionsToHashes.uuid1).toEqual(
      testExternalAttributionsToHashes.uuid2
    );
    expect(testExternalAttributionsToHashes.uuid1).toEqual(
      testExternalAttributionsToHashes.uuid3
    );
    expect(testExternalAttributionsToHashes.uuid1).not.toEqual(
      testExternalAttributionsToHashes.uuid4
    );
    expect(testExternalAttributionsToHashes.uuid4).toEqual(
      testExternalAttributionsToHashes.uuid5
    );
  });
});
