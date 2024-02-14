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
  const resourcesToAttributions: ResourcesToAttributions = {
    '/directory': ['attribution2'],
    '/directory/subdirectory': ['attribution1', 'attribution2'],
    '/directory/subdirectory/secondsub/thirdsubdirectory': ['attribution1'],
  };

  it('counts attributions contained in but not on selected resource', () => {
    const result = getContainedAttributionCount({
      resourcesWithAttributedChildren:
        testResourcesWithExternalAttributedChildren,
      resourceId: '/directory',
      resourcesToAttributions,
    });
    expect(result).toEqual({ attribution1: 2 });
  });

  it('ignores resolved attributions', () => {
    const result = getContainedAttributionCount({
      resourcesWithAttributedChildren:
        testResourcesWithExternalAttributedChildren,
      resourceId: '/directory',
      resourcesToAttributions,
      resolvedExternalAttributions: new Set(['attribution1']),
    });
    expect(result).toEqual({});
  });

  it('handles resources without attributions', () => {
    const result = getContainedAttributionCount({
      resourcesWithAttributedChildren:
        testResourcesWithExternalAttributedChildren,
      resourceId: 'resource-without-attributions',
      resourcesToAttributions,
    });
    expect(result).toEqual({});
  });
});
