// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionsToResources } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { computeChildrenWithAttributions } from '../action-and-reducer-helpers';

describe('computeChildrenWithAttributions', () => {
  it('parses ResourcesWithAttributionsFromDb', () => {
    const testUuid = faker.string.uuid();
    const attributionsToResources: AttributionsToResources = {
      [testUuid]: ['/root/src/', '/root/src/something.js/subfolder'],
    };
    const result = computeChildrenWithAttributions(attributionsToResources);

    expect(result).toEqual({
      attributedChildren: {
        '0': new Set<number>().add(3),
        '1': new Set<number>().add(0).add(3),
        '2': new Set<number>().add(0).add(3),
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
