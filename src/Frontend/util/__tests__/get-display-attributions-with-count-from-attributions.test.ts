// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../shared/shared-types';
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
          comments: ['comment A'],
          id: 'uuid_1',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          comments: [''],
          id: 'uuid_2',
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      comments: ['comment A'],
      linkedAttributionIds: ['uuid_1', 'uuid_2'],
      count: 2,
      id: 'uuid_1',
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
          id: 'uuid_1',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          attributionConfidence: 80,
          id: 'uuid_2',
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      attributionConfidence: 20,
      linkedAttributionIds: ['uuid_1', 'uuid_2'],
      count: 2,
      id: 'uuid_1',
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
          id: 'uuid_1',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          originIds: ['id_2', 'id_3'],
          id: 'uuid_2',
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      linkedAttributionIds: ['uuid_1', 'uuid_2'],
      originIds: ['id_1', 'id_2', 'id_3'],
      count: 2,
      id: 'uuid_1',
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
          id: 'uuid_1',
        },
        1,
      ],
      ['uuid_2', { packageName: 'React', id: 'uuid_2' }, undefined],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      linkedAttributionIds: ['uuid_1', 'uuid_2'],
      count: 1,
      id: 'uuid_1',
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
          id: 'uuid_1',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          id: 'uuid_2',
        },
        2,
      ],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      linkedAttributionIds: ['uuid_1', 'uuid_2'],
      count: 2,
      id: 'uuid_1',
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
          comments: ['comment A'],
          attributionConfidence: 20,
          originIds: ['id_1', 'id_2'],
          id: 'uuid_1',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          comments: ['comment B'],
          attributionConfidence: 80,
          originIds: ['id_2', 'id_3'],
          id: 'uuid_2',
        },
        2,
      ],
      [
        'uuid_3',
        { packageName: 'React', comments: [''], id: 'uuid_3' },
        undefined,
      ],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      comments: ['comment A', 'comment B'],
      attributionConfidence: 20,
      linkedAttributionIds: ['uuid_1', 'uuid_2', 'uuid_3'],
      originIds: ['id_1', 'id_2', 'id_3'],
      count: 2,
      id: 'uuid_1',
    };
    const testDisplayAttributionWithCount =
      getDisplayPackageInfoWithCountFromAttributions(
        testAttributionsWithIdsAndCounts,
      );

    expect(testDisplayAttributionWithCount).toEqual(
      expectedDisplayAttributionWithCount,
    );
  });
  it('sets wasPreffered to true for display Attribution if at least one Attribution wasPreferred', () => {
    const testAttributionsWithIdsAndCounts: Array<
      [string, PackageInfo, number | undefined]
    > = [
      [
        'uuid_1',
        {
          packageName: 'React',
          comments: ['comment A'],
          attributionConfidence: 20,
          originIds: ['id_1', 'id_2'],
          wasPreferred: false,
          id: 'uuid_1',
        },
        1,
      ],
      [
        'uuid_2',
        {
          packageName: 'React',
          comments: ['comment B'],
          attributionConfidence: 80,
          originIds: ['id_2', 'id_3'],
          wasPreferred: true,
          id: 'uuid_2',
        },
        2,
      ],
      [
        'uuid_3',
        {
          packageName: 'React',
          comments: ['comment C'],
          attributionConfidence: 80,
          originIds: ['id_2', 'id_3'],
          wasPreferred: false,
          id: 'uuid_3',
        },
        1,
      ],
    ];
    const expectedDisplayAttributionWithCount: PackageInfo = {
      packageName: 'React',
      comments: ['comment A', 'comment B', 'comment C'],
      attributionConfidence: 20,
      linkedAttributionIds: ['uuid_1', 'uuid_2', 'uuid_3'],
      originIds: ['id_1', 'id_2', 'id_3'],
      wasPreferred: true,
      count: 2,
      id: 'uuid_1',
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
