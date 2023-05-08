// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfos } from '../../../types/types';
import { getFilteredPackageCardIdsFromDisplayPackageInfos } from '../package-list-helpers';

describe('getFilteredPackageCardIdsFromDisplayPackageInfos', () => {
  it('filters PackageCardIds', () => {
    const testSortedPackageCardIds = [
      'Signals-0',
      'Signals-1',
      'Signals-2',
      'Signals-3',
      'Signals-4',
    ];

    /* eslint-disable @typescript-eslint/no-magic-numbers */
    const testDisplayPackageInfos: DisplayPackageInfos = {
      [testSortedPackageCardIds[0]]: {
        packageName: 'Search_term package',
        attributionIds: ['uuid1'],
      },
      [testSortedPackageCardIds[1]]: {
        copyright: '(c) Search_term 2022',
        attributionIds: ['uuid2'],
      },
      [testSortedPackageCardIds[2]]: {
        licenseName: 'Search_term licence',
        attributionIds: ['uuid3'],
      },
      [testSortedPackageCardIds[3]]: {
        packageVersion: 'version search_term',
        attributionIds: ['uuid4'],
      },
      [testSortedPackageCardIds[4]]: {
        comments: ['comment search_term'],
        licenseText: 'text search_term',
        url: 'www.search_term.com',
        attributionIds: ['uuid5'],
      },
    };

    const testFilteredPackageCardIds =
      getFilteredPackageCardIdsFromDisplayPackageInfos(
        testDisplayPackageInfos,
        testSortedPackageCardIds,
        'SeArCh_TeRm'
      );

    expect(testFilteredPackageCardIds).toContain(testSortedPackageCardIds[0]);
    expect(testFilteredPackageCardIds).toContain(testSortedPackageCardIds[1]);
    expect(testFilteredPackageCardIds).toContain(testSortedPackageCardIds[2]);
    expect(testFilteredPackageCardIds).toContain(testSortedPackageCardIds[3]);
    expect(testFilteredPackageCardIds).not.toContain(
      testSortedPackageCardIds[4]
    );
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  });
});
