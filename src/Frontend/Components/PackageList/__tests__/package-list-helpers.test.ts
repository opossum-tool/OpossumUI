// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../../../shared/shared-types';
import { getFilteredPackageIdsFromAttributions } from '../package-list-helpers';

describe('The PackageListHelper', () => {
  it('filters Attributions', () => {
    const testAttributions: Attributions = {
      uuid1: {
        packageName: 'Search_term package',
      },
      uuid2: {
        copyright: '(c) Search_term 2022',
      },
      uuid3: {
        licenseName: 'Search_term licence',
      },
      uuid4: {
        packageVersion: 'version search_term',
      },
      uuid5: {
        comment: 'comment search_term',
        licenseText: 'text search_term',
        url: 'www.search_term.com',
      },
    };
    const testAttributionIds = Object.entries(testAttributions).map(
      ([attributionId]) => attributionId
    );
    const filteredTestAttributions = getFilteredPackageIdsFromAttributions(
      testAttributions,
      testAttributionIds,
      'SeArCh_TeRm'
    );

    expect(filteredTestAttributions).toContain('uuid1');
    expect(filteredTestAttributions).toContain('uuid2');
    expect(filteredTestAttributions).toContain('uuid3');
    expect(filteredTestAttributions).toContain('uuid4');
    expect(filteredTestAttributions).not.toContain('uuid5');
  });

  it('sorts Attributions', () => {
    const testAttributions = {
      uuid1: {
        packageName: 'package 3',
      },
      uuid2: {
        packageName: 'package 1',
      },
      uuid3: {
        packageName: 'package 2',
      },
    };
    const testAttributionIds = Object.entries(testAttributions).map(
      ([attributionId]) => attributionId
    );
    const filteredTestAttributions = getFilteredPackageIdsFromAttributions(
      testAttributions,
      testAttributionIds,
      ''
    );
    expect(filteredTestAttributions).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });
});
