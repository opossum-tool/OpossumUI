// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { getContainedAttributionCount } from '../get-contained-attribution-count';

describe('getContainedAttributionCount', () => {
  const testResourcesWithExternalAttributedChildren: ResourcesWithAttributedChildren =
    {
      attributedChildren: {
        '0': new Set<number>().add(1).add(2),
        '3': new Set<number>().add(4),
      },
      pathsToIndices: {
        '/directory': 0,
        '/directory/subdirectory': 1,
        '/directory/subdirectory/secondsub/thirdsubdirectory': 2,
        '/anotherdirectory': 3,
        '/anotherdirectory/subdirectory': 4,
      },
      paths: [
        '/directory',
        '/directory/subdirectory',
        '/directory/subdirectory/secondsub/thirdsubdirectory',
        '/anotherdirectory',
        '/anotherdirectory/subdirectory',
      ],
    };
  const expectedResult = new Set()
    .add('/directory/subdirectory')
    .add('/directory/subdirectory/secondsub/thirdsubdirectory');
  const resourcesToAttributions: ResourcesToAttributions = {};

  it('with existing attributed children', () => {
    const result = getContainedAttributionCount({
      resourcesWithAttributedChildren:
        testResourcesWithExternalAttributedChildren,
      resourceId: '/directory',
      resourcesToAttributions,
    });
    expect(result).toEqual(expectedResult);
  });

  it('without existing attributed children', () => {
    const result = getContainedAttributionCount({
      resourcesWithAttributedChildren:
        testResourcesWithExternalAttributedChildren,
      resourceId: 'nonexistingdirectory',
      resourcesToAttributions,
    });
    expect(result).toEqual(new Set());
  });
});
