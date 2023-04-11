// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsToResources } from '../../../../shared/shared-types';
import { getAllResourcePathsForAttributions } from '../resource-path-popup-helpers';

describe('getAllResourcePathsForAttributions', () => {
  it('gets resource paths for attributions', () => {
    const attributionsToResources: AttributionsToResources = {
      uuid1: ['/some/path1', '/some/other/path1'],
      uuid2: ['/some/path2'],
      uuid3: ['/some/path3'],
    };

    const attributionIds = ['uuid1', 'uuid2'];
    const expectedResourcesPaths = [
      '/some/path1',
      '/some/other/path1',
      '/some/path2',
    ];

    const resourcesPaths = getAllResourcePathsForAttributions(
      attributionIds,
      attributionsToResources
    );

    expect(resourcesPaths.sort()).toEqual(expectedResourcesPaths.sort());
  });

  it('deduplicates resource paths', () => {
    const attributionsToResources: AttributionsToResources = {
      uuid1: ['/some/path'],
      uuid2: ['/some/path'],
      uuid3: ['/some/path'],
    };

    const attributionIds = ['uuid1', 'uuid2', 'uuid3'];

    const resourcesPaths = getAllResourcePathsForAttributions(
      attributionIds,
      attributionsToResources
    );

    const expectedResourcesPaths = ['/some/path'];
    expect(resourcesPaths).toEqual(expectedResourcesPaths);
  });
});
