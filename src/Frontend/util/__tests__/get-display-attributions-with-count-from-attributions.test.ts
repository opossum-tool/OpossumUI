// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import { DisplayPackageInfoWithCount } from '../../types/types';
import { getDisplayPackageInfoWithCountFromAttributions } from '../get-display-attributions-with-count-from-attributions';

describe('getDisplayAttributionWithCountFromAttributions', () => {
  it('ignores empty comments', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
          comment: 'comment A',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          comment: '',
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: DisplayPackageInfoWithCount = {
      displayPackageInfo: {
        packageName: 'React',
        comments: ['comment A'],
        attributionIds: ['uuid_1', 'uuid_2'],
      },
      count: 3,
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });

  it('adopts lowest attributionConfidence', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
          attributionConfidence: 20,
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          attributionConfidence: 80,
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: DisplayPackageInfoWithCount = {
      displayPackageInfo: {
        packageName: 'React',
        attributionConfidence: 20,
        attributionIds: ['uuid_1', 'uuid_2'],
      },
      count: 3,
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });

  it('combines originIds without duplicates', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
          originIds: ['id_1', 'id_2'],
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          originIds: ['id_2', 'id_3'],
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: DisplayPackageInfoWithCount = {
      displayPackageInfo: {
        packageName: 'React',
        attributionIds: ['uuid_1', 'uuid_2'],
        originIds: ['id_1', 'id_2', 'id_3'],
      },
      count: 3,
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });

  it('handles inputs without count', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
        },
        1,
      ],
      ['uuid_2', { packageName: 'React' }, undefined],
    ];
    const expectedDisplayAttributionWithCount: DisplayPackageInfoWithCount = {
      displayPackageInfo: {
        packageName: 'React',
        attributionIds: ['uuid_1', 'uuid_2'],
      },
      count: 1,
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });

  it('ignores attributionConfidence when not provided', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: DisplayPackageInfoWithCount = {
      displayPackageInfo: {
        packageName: 'React',
        attributionIds: ['uuid_1', 'uuid_2'],
      },
      count: 3,
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });

  it('yields correct results with combined edge cases', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
          comment: 'comment A',
          attributionConfidence: 20,
          originIds: ['id_1', 'id_2'],
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          comment: 'comment B',
          attributionConfidence: 80,
          originIds: ['id_2', 'id_3'],
        },
        2,
      ],
      ['uuid_3', { packageName: 'React', comment: '' }, undefined],
    ];
    const expectedDisplayAttributionWithCount: DisplayPackageInfoWithCount = {
      displayPackageInfo: {
        packageName: 'React',
        comments: ['comment A', 'comment B'],
        attributionConfidence: 20,
        attributionIds: ['uuid_1', 'uuid_2', 'uuid_3'],
        originIds: ['id_1', 'id_2', 'id_3'],
      },
      count: 3,
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });
});
