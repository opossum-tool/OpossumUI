// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfos } from '../../../types/types';
import { getFilteredPackageCardIdsFromDisplayPackageInfos } from '../package-list-helpers';

describe('getFilteredPackageCardIdsFromDisplayPackageInfos', () => {
  it('filters PackageCardIds', () => {
    const testSortedPackageCardIds = ['Signals-0', 'Signals-1'];

    const testDisplayPackageInfos: DisplayPackageInfos = {
      [testSortedPackageCardIds[0]]: {
        packageName: 'Search_term package',
        attributionIds: ['uuid0'],
      },
      [testSortedPackageCardIds[1]]: {
        attributionIds: ['uuid1'],
      },
    };

    const testFilteredPackageCardIds =
      getFilteredPackageCardIdsFromDisplayPackageInfos(
        testDisplayPackageInfos,
        testSortedPackageCardIds,
        'SeArCh_TeRm',
      );

    expect(testFilteredPackageCardIds).toContain(testSortedPackageCardIds[0]);
    expect(testFilteredPackageCardIds).not.toContain(
      testSortedPackageCardIds[1],
    );
  });
});
