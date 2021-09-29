// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
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
import { getParsedInputFile } from '../../../test-helpers/test-helpers';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { attributionForTemporaryPackageInfoExists } from '../save-action-helpers';
import { NIL as uuidNil } from 'uuid';
import { computeChildrenWithAttributions } from '../action-and-reducer-helpers';
import { DiscreteConfidence } from '../../../enums/enums';

describe('The attributionForTemporaryPackageInfoExists function', () => {
  test('checks if manual attributions exist', () => {
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
        attributionConfidence: DiscreteConfidence.High,
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
        getParsedInputFile(
          testResources,
          testManualAttributions,
          testResourcesToManualAttributions
        )
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
  test('parses ResourcesWithAttributionsFromDb', () => {
    const testUuid: string = uuidNil;
    const mockResourcesWithAttributionsFromDb: ResourcesToAttributions = {
      '/root/src/': [testUuid],
      '/root/src/something.js/subfolder': [testUuid],
    };
    const result = computeChildrenWithAttributions(
      mockResourcesWithAttributionsFromDb
    );

    expect(result).toEqual({
      '/': new Set().add('/root/src/').add('/root/src/something.js/subfolder'),
      '/root/': new Set()
        .add('/root/src/')
        .add('/root/src/something.js/subfolder'),
      '/root/src/': new Set().add('/root/src/something.js/subfolder'),
      '/root/src/something.js/': new Set().add(
        '/root/src/something.js/subfolder'
      ),
    });
  });
});
