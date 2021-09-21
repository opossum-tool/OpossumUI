// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ResourcesWithAttributedChildren } from '../../../shared/shared-types';
import { getAttributedChildren } from '../get-attributed-children';

describe('getAttributedChildren', () => {
  const testResourcesWithExternalAttributedChildren: ResourcesWithAttributedChildren =
    {
      '/directory': new Set()
        .add('/directory/subdirectory')
        .add(
          '/directory/subdirectory/secondsub/thirdsubdirectory'
        ) as Set<string>,
      '/anotherdirectory': new Set().add(
        '/anotherdirectory/subdirectory'
      ) as Set<string>,
    };
  const expectedResult = new Set()
    .add('/directory/subdirectory')
    .add('/directory/subdirectory/secondsub/thirdsubdirectory');
  test('with existing attributed children', () => {
    const result = getAttributedChildren(
      testResourcesWithExternalAttributedChildren,
      '/directory'
    );
    expect(result).toEqual(expectedResult);
  });

  test('without existing attributed children', () => {
    const result = getAttributedChildren(
      testResourcesWithExternalAttributedChildren,
      'nonexistingdirectory'
    );
    expect(result).toEqual(new Set());
  });
});
