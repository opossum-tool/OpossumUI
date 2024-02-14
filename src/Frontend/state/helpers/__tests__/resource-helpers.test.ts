// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  getResourceIdsFromResources,
  getResourcesFromIds,
} from '../resources-helpers';

describe('getResourceIdsFromResources', () => {
  it('returns IDs from resources', () => {
    expect(
      getResourceIdsFromResources({
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
      }).sort(),
    ).toEqual([
      '/root/',
      '/root/readme.md',
      '/root/src/',
      '/root/src/something.js',
      '/thirdParty/',
      '/thirdParty/package_1.tr.gz',
      '/thirdParty/package_2.tr.gz',
    ]);
  });
});

describe('getResourcesFromIds', () => {
  it('returns resources from IDs', () => {
    expect(
      getResourcesFromIds([
        '/root/',
        '/root/readme.md',
        '/root/src/',
        '/root/src/something.js',
        '/thirdParty/',
        '/thirdParty/package_1.tr.gz',
        '/thirdParty/package_2.tr.gz',
      ]),
    ).toEqual({
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
    });
  });
});
