// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../../shared/shared-types';
import { getPathsFromResources } from '../file-search-helpers';

describe('The getPathsFromResources function', () => {
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

  test('returns only base path for empty resources', () => {
    const paths = getPathsFromResources({});
    expect(paths).toEqual(['/']);
  });
  test('returns all paths', () => {
    const paths = getPathsFromResources(testResources).sort();
    const expectedPaths = [
      '/',
      '/root/',
      '/root/readme.md',
      '/root/src/',
      '/root/src/something.js',
      '/thirdParty/',
      '/thirdParty/package_1.tr.gz',
      '/thirdParty/package_2.tr.gz',
    ];
    expect(paths).toEqual(expectedPaths);
  });
});
